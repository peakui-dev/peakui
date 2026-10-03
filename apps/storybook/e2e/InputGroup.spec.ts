import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус семейства полей. Здесь живёт ровно то, что jsdom подделывает: настоящий фокус от
 * настоящего указателя, измеренная геометрия и реальная отрисовка кольца.
 *
 * Аудит идёт по прямому адресу iframe. Через манагер с селектором фрейма проверялся бы сам элемент
 * iframe, а не история внутри него: injectAxe доходит только до главного фрейма. Эта ошибка в
 * репозитории однажды уже прошла и спрятала настоящий дефект контраста — см. ../AGENTS.md.
 */

const STYLE_LAYER_STORIES = [
  "components-input--without-react",
  "components-input--states-by-hand",
  "components-input--variant-function-parity",
  "components-inputgroup--without-react",
  "components-inputgroup--states-by-hand",
  "components-inputgroup--rtl",
  "components-label--without-react",
  "components-label--states-by-hand",
  "components-fielderror--without-react",
  "components-fieldset--without-react",
] as const;

const REACT_STORIES = [
  "components-input--variants",
  "components-input--invalid",
  "components-textfield--invalid",
  "components-textfield--required",
  "components-inputgroup--with-prefix",
  "components-inputgroup--with-text-area",
  "components-inputgroup--with-button-in-suffix",
  "components-inputgroup--in-field",
  "components-fieldset--default",
  "components-fieldset--disabled",
] as const;

const STORIES = [...STYLE_LAYER_STORIES, ...REACT_STORIES] as const;
const THEMES = ["default-light", "default-dark"] as const;

test.describe("Семейство полей — стилевой слой и React-компоненты", () => {
  /*
   * Обещание Framework-Agnostic Styles как тест: голая разметка без единого React-компонента обязана
   * получить настоящую заливку, высоту и радиус. Разъехалось бы имя класса с правилом — поле
   * осталось бы прозрачным, молча и без ошибки.
   */
  test("голая разметка поля стилизуется без React", async ({page}) => {
    await page.goto("/iframe.html?id=components-input--without-react&globals=theme:default-light");

    const input = page.getByLabel("secondary");

    await expect(input).toBeVisible();

    const computed = await input.evaluate((el) => {
      const style = getComputedStyle(el);

      return {
        background: style.backgroundColor,
        height: Number.parseFloat(style.height),
        radius: Number.parseFloat(style.borderTopLeftRadius),
      };
    });

    expect(computed.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(computed.radius).toBeGreaterThan(0);
    /* Пол WCAG 2.2 для цели указателя — 24px; базовая высота рассчитана с запасом. */
    expect(computed.height).toBeGreaterThanOrEqual(24);
  });

  test.describe("клик по слоту", () => {
    /*
     * Настоящий указатель по настоящему элементу: в jsdom это проверено, но там нет ни попадания по
     * координатам, ни того, что слот вообще перехватывает событие.
     */
    test("клик по префиксу ставит фокус в однострочный контрол", async ({page}) => {
      await page.goto(
        "/iframe.html?id=components-inputgroup--with-prefix&globals=theme:default-light",
      );

      const input = page.getByLabel("Логин");

      await expect(input).toBeVisible();
      await page.getByText("@", {exact: true}).click();

      await expect(input).toBeFocused();
    });

    /*
     * Регрессия на дефект эталона: он ищет querySelector("input"), и textarea этим селектором не
     * находится — клик по префиксу у него не ставит фокус никуда.
     */
    test("клик по префиксу ставит фокус в многострочный контрол", async ({page}) => {
      await page.goto(
        "/iframe.html?id=components-inputgroup--with-text-area&globals=theme:default-light",
      );

      const textarea = page.getByLabel("О себе");

      await expect(textarea).toBeVisible();
      await page.getByText("✎", {exact: true}).click();

      await expect(textarea).toBeFocused();
    });

    test("клик по кнопке в суффиксе не уводит фокус в поле", async ({page}) => {
      await page.goto(
        "/iframe.html?id=components-inputgroup--with-button-in-suffix&globals=theme:default-light",
      );

      const button = page.getByRole("button", {name: "Очистить"});

      await expect(button).toBeVisible();
      await button.click();

      await expect(page.getByLabel("Запрос")).not.toBeFocused();
    });
  });

  test.describe("геометрия", () => {
    /*
     * Кольцо фокуса рисует оболочка, а не контрол внутри неё: иначе оно упирается в границы
     * префикса. И оболочка обязана остаться overflow: visible — overflow: hidden срезал бы кольцо
     * фокуса кнопки в суффиксе, то есть SC 2.4.11. Это и есть причина, по которой фокус рисуется
     * outline, а не ring (box-shadow) как у эталона.
     */
    test("кольцо фокуса рисует оболочка и ничем не срезается", async ({page}) => {
      await page.goto(
        "/iframe.html?id=components-inputgroup--with-prefix&globals=theme:default-light",
      );

      const input = page.getByLabel("Логин");

      await expect(input).toBeVisible();
      await input.focus();

      const shell = page.locator('[data-slot="input-group"]');

      const measured = await shell.evaluate((el) => {
        const shellStyle = getComputedStyle(el);
        const control = el.querySelector("input")!;
        const controlStyle = getComputedStyle(control);

        return {
          controlOutline: Number.parseFloat(controlStyle.outlineWidth),
          controlOutlineStyle: controlStyle.outlineStyle,
          shellOutline: Number.parseFloat(shellStyle.outlineWidth),
          shellOverflow: shellStyle.overflowX,
        };
      });

      expect(measured.shellOutline).toBeGreaterThan(0);
      expect(measured.controlOutlineStyle).toBe("none");
      expect(measured.shellOverflow).toBe("visible");
    });

    /* Оболочка растёт вместе с многострочным контролом, а не обрезает его. */
    test("оболочка растёт под многострочный контрол", async ({page}) => {
      await page.goto(
        "/iframe.html?id=components-inputgroup--with-text-area&globals=theme:default-light",
      );

      const shell = page.locator('[data-slot="input-group"]');

      await expect(shell).toBeVisible();

      const measured = await shell.evaluate((el) => {
        const textarea = el.querySelector("textarea")!;

        return {
          clipped: textarea.scrollHeight > textarea.clientHeight + 1,
          shellHeight: el.getBoundingClientRect().height,
          textareaHeight: textarea.getBoundingClientRect().height,
        };
      });

      expect(measured.clipped).toBe(false);
      /* Три строки заметно выше однострочного поля в 36px. */
      expect(measured.shellHeight).toBeGreaterThan(48);
      expect(measured.shellHeight).toBeGreaterThanOrEqual(measured.textareaHeight);
    });
  });

  for (const theme of THEMES) {
    for (const id of STORIES) {
      test(`${id} не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

        /*
         * Признак готовности: холодный dev-сервер отдаёт пустой iframe раньше, чем история
         * отрендерится, и axe по пустой странице нашёл бы ноль нарушений — молча и зелёным.
         * Заголовок второго уровня есть у каждой истории набора именно для этого.
         */
        await expect(page.getByRole("heading", {level: 2})).toBeVisible();

        await injectAxe(page);
        await checkA11y(page, undefined, {
          /*
           * WCAG 2.2 AA — строгое надмножество 2.1 AA, поэтому теги 2.1 обязательны: без них
           * правила, помеченные в axe как добавленные в 2.1, не выполняются вообще, а тест при
           * этом называется «не нарушает WCAG 2.2 AA».
           */
          axeOptions: {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
            },
          },
          detailedReport: true,
        });
      });
    }
  }
});

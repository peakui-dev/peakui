import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Файл покрывает оба яруса Button, и оба нужны. Истории стилевого слоя доказывают обещание
 * Framework-Agnostic Styles: голая разметка без единого React-компонента обязана получить
 * настоящий фон, высоту и радиус. Истории React-компонента доказывают поведение, которого у
 * стилевого слоя нет вовсе — pending не существует вне React, его ставит примитив RAC.
 *
 * Первый ярус не вытеснен вторым: потребитель на Vue, Svelte или чистом HTML остаётся
 * потребителем, и ломаться его рецепт обязан здесь, а не у него.
 *
 * Аудит идёт по прямому адресу iframe. Через манагер с селектором фрейма — checkA11y(page,
 * "#storybook-preview-iframe") — проверялся бы сам элемент iframe, а не история внутри него:
 * injectAxe доходит только до главного фрейма. Эта ошибка здесь однажды уже прошла и спрятала
 * настоящий дефект контраста, см. ../AGENTS.md.
 */

const STYLE_LAYER_STORIES = [
  "components-button--without-react",
  "components-button--variant-function-parity",
] as const;

const REACT_STORIES = [
  "components-button--variants",
  "components-button--pending",
  "components-spinner--sizes",
] as const;

const STORIES = [...STYLE_LAYER_STORIES, ...REACT_STORIES] as const;
const THEMES = ["default-light", "default-dark"] as const;

test.describe("Button — стилевой слой и React-компонент", () => {
  /*
   * Обещание Framework-Agnostic Styles как тест, а не как стори: голая разметка без единого
   * React-компонента PeakUI обязана получить настоящий фон, высоту и радиус. Если бы CSS не доехал
   * или имя класса разъехалось с правилом, фон остался бы прозрачным — молча, без ошибки.
   */
  test("голая разметка стилизуется без React", async ({page}) => {
    await page.goto(`/iframe.html?id=${STYLE_LAYER_STORIES[0]}&globals=theme:default-light`);

    const link = page.locator("a.button--secondary");

    await expect(link).toBeVisible();

    const computed = await link.evaluate((el) => {
      const style = getComputedStyle(el);

      return {
        background: style.backgroundColor,
        decoration: style.textDecorationLine,
        height: Number.parseFloat(style.height),
        radius: Number.parseFloat(style.borderTopLeftRadius),
      };
    });

    expect(computed.background).not.toBe("rgba(0, 0, 0, 0)");
    expect(computed.radius).toBeGreaterThan(0);
    expect(computed.decoration).toBe("none");
    // Пол WCAG 2.2 для цели указателя — 24px; базовая высота рассчитана с запасом.
    expect(computed.height).toBeGreaterThanOrEqual(24);
  });

  /*
   * Единственная проверка, которую стилевой слой сделать не может: pending ставит примитив RAC,
   * и вне React состояния не существует. Читается вычисленный стиль, а не наличие класса —
   * правило могло бы разъехаться с именем и остаться незамеченным.
   */
  test("pending-кнопка не принимает нажатие и остаётся фокусируемой", async ({page}) => {
    await page.goto("/iframe.html?id=components-button--pending&globals=theme:default-light");

    const button = page.getByRole("button", {name: "Сохраняем"});

    await expect(button).toHaveAttribute("data-pending", "true");
    await expect(button).toHaveCSS("pointer-events", "none");

    await button.focus();
    await expect(button).toBeFocused();
  });

  for (const theme of THEMES) {
    for (const id of STORIES) {
      test(`${id} не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

        /*
         * Готовность истории, а не её форма. Раньше здесь ждали заголовок второго уровня — он
         * есть у историй стилевого слоя и отсутствует у историй компонента, так что проба
         * падала на половине набора. Ждём первый отрисованный элемент корня: смысл пробы —
         * холодный dev-сервер компилирует превью по первому запросу и отдаёт пустой iframe
         * раньше, чем история отрендерится.
         */
        await expect(page.locator("#storybook-root > *").first()).toBeVisible();

        await injectAxe(page);
        await checkA11y(page, undefined, {
          axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
          detailedReport: true,
        });
      });
    }
  }
});

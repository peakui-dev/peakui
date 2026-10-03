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
  "components-button--icon-only",
  "components-button--full-width",
  "components-button--disabled",
  "components-button--pending",
  "components-spinner--sizes",
  "components-spinner--colors",
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

    /*
     * exact: true не для красоты — по умолчанию getByRole сверяет имя подстрокой, и загрязнение
     * имени индикатором («Loading Сохраняем») проходило бы здесь незамеченным.
     */
    const button = page.getByRole("button", {exact: true, name: "Сохраняем"});

    await expect(button).toHaveAttribute("data-pending", "true");
    await expect(button).toHaveCSS("pointer-events", "none");

    await button.focus();
    await expect(button).toBeFocused();
  });

  /*
   * Паритет с эталоном по вычисленным стилям, а не по наличию класса. Всё перечисленное отваливается
   * молча: имя класса остаётся, правило уходит, и ни один тест на BEM-имена этого не видит.
   *
   * Эталон: heroui/packages/styles/components/button.css.
   */
  test.describe("паритет с эталоном", () => {
    test("радиус, перенос строки и переход взяты у эталона", async ({page}) => {
      await page.goto("/iframe.html?id=components-button--variants&globals=theme:default-light");

      const button = page.getByRole("button", {name: "primary"}).first();

      await expect(button).toBeVisible();

      /* rounded-3xl у эталона — это --radius-3xl, то есть calc(0.5rem * 3). */
      await expect(button).toHaveCSS("border-radius", "24px");
      /* Без nowrap длинный текст переносится и ломает высоту кнопки. */
      await expect(button).toHaveCSS("white-space", "nowrap");

      const transition = await button.evaluate((el) => getComputedStyle(el).transitionProperty);

      expect(transition).toContain("transform");
      expect(transition).toContain("background-color");
    });

    /*
     * Кольцо фокуса — ТЕНЬ, как у эталона: focus-ring собран из ring-2 ring-offset-background, то
     * есть двух теней — отступ цветом фона, затем само кольцо, — и box-shadow стоит в списке
     * перехода. Проверяется вычисленный стиль, а не наличие класса.
     */
    test("кольцо фокуса — тень с отступом, и она участвует в переходе", async ({page}) => {
      await page.goto("/iframe.html?id=components-button--variants&globals=theme:default-light");

      const button = page.getByRole("button", {name: "primary"}).first();

      await expect(button).toBeVisible();

      const idle = await button.evaluate((el) => ({
        boxShadow: getComputedStyle(el).boxShadow,
        transition: getComputedStyle(el).transitionProperty,
      }));

      expect(idle.transition).toContain("box-shadow");
      expect(idle.transition).not.toContain("outline");

      await button.focus();

      const focused = await button.evaluate((el) => ({
        boxShadow: getComputedStyle(el).boxShadow,
        outlineStyle: getComputedStyle(el).outlineStyle,
      }));

      expect(focused.boxShadow).not.toBe(idle.boxShadow);
      expect(focused.outlineStyle).toBe("none");
      /* Две тени: отступ и кольцо. Разделитель между ними — запятая. */
      expect(focused.boxShadow.split(/,(?![^(]*\))/)).toHaveLength(2);
    });

    test("нажатие вжимает кнопку", async ({page}) => {
      await page.goto("/iframe.html?id=components-button--variants&globals=theme:default-light");

      const button = page.getByRole("button", {name: "primary"}).first();

      await expect(button).toBeVisible();
      /*
       * transform-gpu на базе делает вычисленный transform единичной матрицей, а не "none" —
       * первая версия теста сравнивала с "none" и падала на здоровом коде.
       */
      await expect(button).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");

      const box = (await button.boundingBox())!;

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();

      try {
        await expect(button).toHaveAttribute("data-pressed", "true");
        /* scale(0.97) — та же матрица, но с масштабом; шаг зависит от размера кнопки. */
        await expect(button).not.toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
      } finally {
        await page.mouse.up();
      }
    });

    test("иконка внутри кнопки получает размер от кнопки, спиннер — нет", async ({page}) => {
      await page.goto("/iframe.html?id=components-button--icon-only&globals=theme:default-light");

      /*
       * Ширина вьюпорта Desktop Chrome выше брейкпоинта sm, поэтому действует sm:size-4 — 16px.
       * Отрицательный margin из -mx-0.5 отличает иконку, которой правило досталось, от спиннера,
       * который из него исключён.
       */
      const icon = page.locator('button[data-slot="button"] svg').first();

      await expect(icon).toHaveCSS("width", "16px");
      await expect(icon).toHaveCSS("margin-left", "-2px");

      await page.goto("/iframe.html?id=components-button--pending&globals=theme:default-light");

      const spinnerIcon = page.locator('[data-slot="spinner"] svg').first();

      await expect(spinnerIcon).toBeVisible();
      await expect(spinnerIcon).toHaveCSS("margin-left", "0px");
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
         *
         * Гонки с собственным прогоном axe от addon-a11y здесь больше нет: он выключен в
         * preview.tsx (parameters.a11y.test = "off"), и этот аудит — единственный, кто запускает
         * axe на странице.
         */
        await expect(page.getByRole("heading", {level: 2})).toBeVisible();

        await injectAxe(page);
        await checkA11y(page, undefined, {
          /*
           * WCAG 2.2 AA — строгое надмножество 2.1 AA, поэтому теги 2.1 обязательны: без них
           * правила, которые axe помечает добавленными в 2.1 (autocomplete-valid для SC 1.3.5,
           * avoid-inline-spacing для SC 1.4.12 и прочие), не выполняются вообще, а тест при этом
           * называется «не нарушает WCAG 2.2 AA». Набор без них измерял меньше, чем обещал.
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

import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус SegmentedControl. Здесь живёт то, что jsdom подделывает нулями: индикатор
 * переезжает техникой FLIP — RAC снимает getBoundingClientRect() уходящего экземпляра, ставит
 * новому transient translate и снимает его через requestAnimationFrame, а довозит капсулу уже CSS.
 * В jsdom все прямоугольники нулевые, поэтому переезда там не существует вовсе.
 *
 * Спека по компоненту, не по оверлею, — осознанное исключение из правила apps/storybook/AGENTS.md,
 * и у него есть прецедент: Tabs.spec.ts проверяет свой индикатор ровно так же.
 *
 * Идём по прямому адресу iframe.html: страница и есть документ превью.
 */

const STORY = {
  basic: "components-segmentedcontrol--basic",
  longLabels: "components-segmentedcontrol--long-labels",
} as const;

const A11Y_STORIES = [
  "components-segmentedcontrol--basic",
  "components-segmentedcontrol--icon-only",
  "components-segmentedcontrol--sizes",
  "components-segmentedcontrol--disabled",
  "components-segmentedcontrol--long-labels",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

/*
 * Холодный dev-сервер компилирует историю по первому запросу дольше, чем окно expect из
 * конфигурации, поэтому проверки геометрии получают собственное окно.
 */
const GEOMETRY_TIMEOUT = {timeout: 60_000} as const;

const indicatorIn = (page: Page) =>
  page.locator('[data-slot="segmented-control-indicator"]').first();

/*
 * Переезд идёт через transient translate, поэтому проверять свойство бессмысленно: ждём, пока
 * рамка индикатора сойдётся с рамкой выбранного сегмента. Приём взят из Tabs.spec.ts.
 */
async function expectIndicatorOn(page: Page, segment: Locator, timeout = GEOMETRY_TIMEOUT) {
  const indicator = indicatorIn(page);

  await expect
    .poll(async () => {
      const indicatorBox = await indicator.boundingBox();
      const segmentBox = await segment.boundingBox();

      if (!indicatorBox || !segmentBox) return Number.POSITIVE_INFINITY;

      return Math.max(
        Math.abs(indicatorBox.x - segmentBox.x),
        Math.abs(indicatorBox.width - segmentBox.width),
      );
    }, timeout)
    .toBeLessThan(1);
}

test.describe("SegmentedControl (браузер)", () => {
  // Первый тест воркера платит за холодную компиляцию превью целиком.
  test.setTimeout(150_000);

  test.describe("переезд индикатора", () => {
    test("индикатор переехал к выбранному сегменту", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.basic}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      const grid = page.getByRole("radio", {name: "Grid"});
      const table = page.getByRole("radio", {name: "Table"});

      await expectIndicatorOn(page, grid);

      await table.click();

      await expect(table).toHaveAttribute("aria-checked", "true");
      await expectIndicatorOn(page, table);
    });

    /*
     * Предыдущий тест ловит промах по месту, но не телепорт: осевшая геометрия у поездки и у прыжка
     * одинаковая. Здесь проверяется сам факт перехода — браузер обязан сообщить transitionrun по
     * свойству translate. Без этого «анимация пропала» прошло бы зелёным.
     */
    test("переезд действительно анимируется, а не телепортируется", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.basic}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      await page.evaluate(() => {
        const w = window as unknown as {__transitions: string[]};

        w.__transitions = [];
        document.addEventListener(
          "transitionrun",
          (e) => w.__transitions.push((e as TransitionEvent).propertyName),
          true,
        );
      });

      await page.getByRole("radio", {name: "Table"}).click();
      await expectIndicatorOn(page, page.getByRole("radio", {name: "Table"}));

      const properties = await page.evaluate(
        () => (window as unknown as {__transitions: string[]}).__transitions,
      );

      expect(properties).toContain("translate");
    });

    test("капсула меняет ширину под сегмент другой длины", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.longLabels}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      const hug = page.locator('[data-testid="hug"]');
      const short = hug.getByRole("radio", {name: "Day"});
      const long = hug.getByRole("radio", {name: "Last 12 months"});

      const shortWidth = (await short.boundingBox())?.width ?? 0;
      const longWidth = (await long.boundingBox())?.width ?? 0;

      // Предпосылка теста: сегменты действительно разной ширины, иначе он ничего не проверяет.
      expect(longWidth).toBeGreaterThan(shortWidth + 10);

      await long.click();
      await expectIndicatorOn(page, long);
    });

    test("в RTL индикатор переезжает по инлайн-оси", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.basic}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });

      const table = page.getByRole("radio", {name: "Table"});

      await table.click();

      /*
       * Смысл проверки: капсула садится на тот сегмент, по которому щёлкнули, а не на зеркальный.
       * Дельты считаются по реальным прямоугольникам, поэтому утверждение не зависит от
       * направления письма — оно именно поэтому и ловит зеркальную ошибку.
       */
      await expectIndicatorOn(page, table);
    });
  });

  test("при prefers-reduced-motion переезд выключен, но капсула на месте", async ({page}) => {
    await page.emulateMedia({reducedMotion: "reduce"});
    await page.goto(`/iframe.html?id=${STORY.basic}`);
    await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

    const table = page.getByRole("radio", {name: "Table"});

    await table.click();

    /*
     * Проверяем вычисленный стиль, а не тайминг: гонка с 250ms была бы и флаки, и способна пройти
     * вхолостую, если клик сам занял дольше перехода. motion-reduce обязан стоять ПОСЛЕ
     * transition — иначе он не переопределит, и transition-property останется списком.
     */
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const indicator = document.querySelector(
              '[data-slot="segmented-control-indicator"]',
            ) as HTMLElement | null;

            return indicator ? getComputedStyle(indicator).transitionProperty : "missing";
          }),
        GEOMETRY_TIMEOUT,
      )
      .toBe("none");

    await expectIndicatorOn(page, table);
  });

  for (const theme of THEMES) {
    for (const id of A11Y_STORIES) {
      test(`${id} не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

        /*
         * Признак готовности: холодный dev-сервер отдаёт пустой iframe раньше, чем история
         * смонтируется, и axe по пустой странице нашёл бы ноль нарушений — молча и зелёным.
         */
        await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

        await injectAxe(page);
        await checkA11y(page, undefined, {
          /*
           * WCAG 2.2 AA — строгое надмножество 2.1 AA, поэтому теги 2.1 обязательны: без них
           * правила, которые axe помечает добавленными в 2.1, не выполняются вообще, а тест
           * при этом называется «не нарушает WCAG 2.2 AA». Так же в Tabs, Button и Tooltip.
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

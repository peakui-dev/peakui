import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Tabs. Здесь живёт ровно то, что jsdom подделывает нулями. Кнопки прокрутки
 * открываются правилом :has() по атрибутам ScrollShadow, а те рождаются из измеренной
 * геометрии переполнения; индикатор выбора позиционируется RAC по реальным прямоугольникам;
 * клавиатурный выбор прокручивает ленту к выбранному табу. Ни одно из трёх не существует в
 * jsdom.
 *
 * Идём по прямому адресу iframe.html: страница и есть документ превью.
 */

const STORY = {
  default: "components-tabs--default",
  overflow: "components-tabs--overflow",
} as const;

const A11Y_STORIES = [
  "components-tabs--default",
  "components-tabs--overflow",
  "components-tabs--vertical",
  "components-tabs--with-disabled-tab",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

/*
 * Холодный dev-сервер компилирует историю по первому запросу дольше, чем окно
 * expect из конфигурации, поэтому проверки геометрии получают собственное окно.
 */
const GEOMETRY_TIMEOUT = {timeout: 60_000} as const;

const scrollerIn = (page: Page) =>
  page.locator('[data-slot="tabs-list-container"] > [data-slot="scroll-shadow"]');

test.describe("Tabs (браузер)", () => {
  // Первый тест воркера платит за холодную компиляцию превью целиком.
  test.setTimeout(150_000);

  test.describe("геометрия и прокрутка", () => {
    test.beforeEach(async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.overflow}`);
      // Заголовок истории — знак, что превью смонтировалось.
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);
    });

    test("шевроны скрыты, пока список помещается без скролла", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.default}`);

      await expect(scrollerIn(page)).toBeVisible(GEOMETRY_TIMEOUT);
      await expect(page.getByRole("button", {name: "Scroll tabs left"})).toBeHidden();
      await expect(page.getByRole("button", {name: "Scroll tabs right"})).toBeHidden();
    });

    test("при переполнении открывает только шеврон вперёд", async ({page}) => {
      const scroller = scrollerIn(page);

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await expect(page.getByRole("button", {name: "Scroll tabs left"})).toBeHidden();
      await expect(page.getByRole("button", {name: "Scroll tabs right"})).toBeVisible();
    });

    test("клик по шеврону прокручивает ленту и открывает шеврон назад", async ({page}) => {
      const scroller = scrollerIn(page);

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await page.getByRole("button", {name: "Scroll tabs right"}).click();

      await expect
        .poll(() => scroller.evaluate((el) => el.scrollLeft), GEOMETRY_TIMEOUT)
        .toBeGreaterThan(0);
      await expect(page.getByRole("button", {name: "Scroll tabs left"})).toBeVisible();
    });

    test("клавиатурный выбор прокручивает ленту к выбранному табу", async ({page}) => {
      const scroller = scrollerIn(page);

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await page.getByRole("tab", {name: "Обзор"}).click();
      await page.keyboard.press("End");

      const lastTab = page.getByRole("tab", {name: "Настройки"});

      await expect(lastTab).toHaveAttribute("data-selected", "true");
      // Выбранный таб обязан въехать в поле зрения: его край — внутри ленты.
      await expect
        .poll(async () => {
          const box = await lastTab.boundingBox();
          const left = await scroller.evaluate((el) => el.getBoundingClientRect().left);
          const right = await scroller.evaluate((el) => el.getBoundingClientRect().right);

          return box !== null && box.x + box.width > left && box.x < right;
        }, GEOMETRY_TIMEOUT)
        .toBe(true);
      await expect
        .poll(() => scroller.evaluate((el) => el.scrollLeft), GEOMETRY_TIMEOUT)
        .toBeGreaterThan(0);
    });

    /*
     * Индикатор живёт внутри выбранного таба (absolute inset-0), а RAC анимирует
     * переезд через transient-свойство translate. Значит проверяем геометрию
     * напрямую: после перехода рамка индикатора совпадает с рамкой таба.
     */
    test("индикатор переехал к выбранному табу", async ({page}) => {
      const scroller = scrollerIn(page);

      await expect(scroller).toBeVisible(GEOMETRY_TIMEOUT);
      await page.getByRole("tab", {name: "Обзор"}).click();
      await page.keyboard.press("End");

      const lastTab = page.getByRole("tab", {name: "Настройки"});
      const indicator = page.locator('[data-slot="tabs-indicator"]');

      await expect(lastTab).toHaveAttribute("data-selected", "true");
      await expect
        .poll(async () => {
          const indicatorBox = await indicator.boundingBox();
          const tabBox = await lastTab.boundingBox();

          if (!indicatorBox || !tabBox) return Number.POSITIVE_INFINITY;

          return Math.max(
            Math.abs(indicatorBox.x - tabBox.x),
            Math.abs(indicatorBox.width - tabBox.width),
          );
        }, GEOMETRY_TIMEOUT)
        .toBeLessThan(1);
    });
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
           * при этом называется «не нарушает WCAG 2.2 AA». Так же в Button и Tooltip.
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

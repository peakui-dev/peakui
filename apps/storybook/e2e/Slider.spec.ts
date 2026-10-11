import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Slider. Геометрия заливки считается из состояния (getThumbPercent) и пишется
 * инлайн-стилем в процентах дорожки, а jsdom ничего не знает ни о процентах, ни о рамке дорожки:
 * там существуют только сами строки стиля (это закреплено в jsdom-наборе). Здесь проверяется
 * настоящая геометрия — отношение рамки заливки к внутренней рамке дорожки.
 *
 * Спека по компоненту, не по оверлею, — осознанное исключение из правила apps/storybook/AGENTS.md,
 * с прецедентами Tabs.spec.ts и SegmentedControl.spec.ts: у них так же проверены свои индикаторы.
 *
 * Идём по прямому адресу iframe.html: страница и есть документ превью.
 */

const STORY = {
  default: "components-slider--default",
  range: "components-slider--range",
  vertical: "components-slider--vertical",
} as const;

const A11Y_STORIES = [
  "components-slider--default",
  "components-slider--vertical",
  "components-slider--disabled",
  "components-slider--range",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

/*
 * Холодный dev-сервер компилирует историю по первому запросу дольше, чем окно expect из
 * конфигурации, поэтому проверки геометрии получают собственное окно.
 */
const GEOMETRY_TIMEOUT = {timeout: 60_000} as const;

const fillIn = (page: Page) => page.locator('[data-slot="slider-fill"]').first();
const trackIn = (page: Page) => page.locator('[data-slot="slider-track"]').first();

/** Ширина прозрачной рамки дорожки, в пикселях: заливка считается от её внутренней кромки. */
async function trackBorder(
  track: Locator,
  property: "borderLeftWidth" | "borderTopWidth",
): Promise<number> {
  return track.evaluate((element, prop) => parseFloat(getComputedStyle(element)[prop]), property);
}

/*
 * Заливка обязана занимать [from, to] внутренней ширины дорожки: рамка заливки сравнивается с
 * внутренней рамкой дорожки. Возвращает наибольшее отклонение от долей — его и ждёт poll.
 */
async function horizontalFillError(page: Page, from: number, to: number): Promise<number> {
  const trackBox = await trackIn(page).boundingBox();
  const fillBox = await fillIn(page).boundingBox();

  if (!trackBox || !fillBox) return Number.POSITIVE_INFINITY;

  const border = await trackBorder(trackIn(page), "borderLeftWidth");
  const innerX = trackBox.x + border;
  const innerWidth = trackBox.width - 2 * border;

  return Math.max(
    Math.abs((fillBox.x - innerX) / innerWidth - from),
    Math.abs(fillBox.width / innerWidth - (to - from)),
  );
}

/*
 * Вертикальная заливка растёт от нижней кромки: доля высоты равна значению, нижний край совпадает
 * с внутренней кромкой дорожки.
 */
async function verticalFillError(page: Page, fraction: number): Promise<number> {
  const trackBox = await trackIn(page).boundingBox();
  const fillBox = await fillIn(page).boundingBox();

  if (!trackBox || !fillBox) return Number.POSITIVE_INFINITY;

  const border = await trackBorder(trackIn(page), "borderTopWidth");
  const innerBottom = trackBox.y + trackBox.height - border;
  const innerHeight = trackBox.height - 2 * border;

  return Math.max(
    Math.abs(fillBox.height / innerHeight - fraction),
    Math.abs(fillBox.y + fillBox.height - innerBottom),
  );
}

test.describe("Slider (браузер)", () => {
  // Первый тест воркера платит за холодную компиляцию превью целиком.
  test.setTimeout(150_000);

  test.describe("геометрия заливки", () => {
    test("одиночный бегунок заливает дорожку до 30%", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.default}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      await expect
        .poll(() => horizontalFillError(page, 0, 0.3), GEOMETRY_TIMEOUT)
        .toBeLessThan(0.01);
    });

    test("диапазон заливает дорожку между двумя бегунками", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.range}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      // defaultValue [100, 500] на шкале 0..1000: от 10% до 50% дорожки.
      await expect
        .poll(() => horizontalFillError(page, 0.1, 0.5), GEOMETRY_TIMEOUT)
        .toBeLessThan(0.01);
    });

    test("вертикальная заливка растёт от нижней кромки", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.vertical}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      await expect.poll(() => verticalFillError(page, 0.3), GEOMETRY_TIMEOUT).toBeLessThan(0.01);
    });

    test("клавиша сдвигает и бегунок, и заливку", async ({page}) => {
      await page.goto(`/iframe.html?id=${STORY.default}`);
      await expect(page.getByRole("heading", {level: 2})).toBeVisible(GEOMETRY_TIMEOUT);

      const thumb = page.getByRole("slider", {name: "Volume"});

      await thumb.focus();
      await page.keyboard.press("ArrowRight");

      /*
       * Клавиатурная семантика проверена в jsdom; здесь проверяется её следствие в геометрии —
       * заливка доехала до 31% и не осталась на месте.
       */
      await expect(thumb).toHaveValue("31");
      await expect
        .poll(() => horizontalFillError(page, 0, 0.31), GEOMETRY_TIMEOUT)
        .toBeLessThan(0.01);
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
        /*
         * Заблокированная история: утилита status-disabled за@apply-ена в CSS компонента, поэтому
         * класса .status-disabled в DOM нет — приглушение (opacity 0.5) несёт сам заблокированный
         * корень. Это демонстрация недоступного состояния по замыслу, а WCAG 1.4.3 прямо
         * освобождает неактивные элементы интерфейса от требования контраста. То же исключение с
         * той же причиной живёт в foundations.a11y.spec.ts.
         */
        const disabled = id === "components-slider--disabled";

        await checkA11y(
          page,
          disabled ? {exclude: [['[data-slot="slider"][data-disabled="true"]']]} : undefined,
          {
            /*
             * WCAG 2.2 AA — строгое надмножество 2.1 AA, поэтому теги 2.1 обязательны: без них
             * правила, которые axe помечает добавленными в 2.1, не выполняются вообще, а тест
             * при этом называется «не нарушает WCAG 2.2 AA». Так же в Tabs и SegmentedControl.
             */
            axeOptions: {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
              },
            },
            detailedReport: true,
          },
        );
      });
    }
  }
});

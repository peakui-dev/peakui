import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Tooltip. Здесь живёт ровно то, что jsdom подделывает: настоящая геометрия
 * позиционирования оверлея относительно триггера, настоящий фокус и реальный portal в body.
 *
 * Аудит идёт по прямому адресу iframe (page.goto на /iframe.html), а не через манагер: injectAxe
 * доходит только до главного фрейма, и checkA11y по селектору фрейма проверял бы сам элемент iframe,
 * а не историю внутри него — см. ../AGENTS.md.
 */

const STORIES = [
  "components-tooltip--default",
  "components-tooltip--with-trigger",
  "components-tooltip--placements",
  "components-tooltip--on-surface",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

/*
 * Ховер с прогревом модальности. OnHoverStart в React Aria открывает подсказку только когда
 * getInteractionModality() === 'pointer', а модальность становится 'pointer' от pointermove.
 * На холодной странице hover() в Playwright отдаёт pointerover ДО первого pointermove — и первый
 * ховер молча не срабатывает. Один предварительный mouse.move ставит модальность, как это сделал
 * бы настоящий пользователь, чей курсор всегда откуда-то приезжает.
 */
const warmPointerThenHover = async (page: Page, trigger: Locator) => {
  /* Сначала готовность истории: до монтирования React глобальный слушатель модальности ещё не
   * висит, и mouse.move ниже не был бы услышан. */
  await expect(trigger).toBeVisible();
  await page.mouse.move(5, 5);
  await trigger.hover();
};

test.describe("Tooltip — оверлей в настоящем браузере", () => {
  /*
   * Позиционирование — обещание оверлея, и оно существует только в настоящем layout'е: jsdom
   * отдаёт нулевые rect'ы. Верхнее placement обязано поставить пузырь НАД триггером, с зазором
   * offset (7 со стрелкой), и подписать data-placement — по нему CSS выбирает направление
   * slide-in и поворот стрелки.
   */
  test("наведение открывает подсказку над триггером с data-placement=top", async ({page}) => {
    await page.goto("/iframe.html?id=components-tooltip--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Подробнее"});

    await expect(trigger).toBeVisible();
    await warmPointerThenHover(page, trigger);

    const tooltip = page.getByRole("tooltip");

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute("data-placement", "top");
    await expect(tooltip).toContainText("Подсказка");

    const [triggerBox, tooltipBox] = await Promise.all([
      trigger.boundingBox(),
      tooltip.boundingBox(),
    ]);

    expect(triggerBox).not.toBeNull();
    expect(tooltipBox).not.toBeNull();
    /* Нижняя кромка пузыря — выше верхней кромки триггера, минус offset в 7px со стрелкой. */
    expect(tooltipBox!.y + tooltipBox!.height).toBeLessThanOrEqual(triggerBox!.y + 1);

    /*
     * Стили доехали, а не только имя класса: пузырь берёт фон у overlay-токена. Разъехалось бы
     * правило с именем — фон остался бы прозрачным, молча и без ошибки.
     */
    const background = await tooltip.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  /*
   * Нижнее положение — та же геометрия в другую сторону: пузырь ПОД триггером. Вместе с верхним
   * это доказывает, что placement реально доезжает до позиционера, а не только до атрибута.
   */
  test("placement=bottom ставит подсказку под триггером", async ({page}) => {
    await page.goto("/iframe.html?id=components-tooltip--placements&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Снизу"});

    await expect(trigger).toBeVisible();
    await warmPointerThenHover(page, trigger);

    const tooltip = page.getByRole("tooltip");

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute("data-placement", "bottom");

    const [triggerBox, tooltipBox] = await Promise.all([
      trigger.boundingBox(),
      tooltip.boundingBox(),
    ]);

    expect(tooltipBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 1);
  });

  /*
   * Раскрытие по фокусу — половина контракта доступности: подсказка обязана появляться не только
   * по указателю, но и с клавиатуры, и закрываться по Escape. Это поведение RAC; тест охраняет
   * его от того, чтобы обёртка его случайно сломала.
   */
  test("фокус открывает подсказку, Escape закрывает", async ({page}) => {
    await page.goto("/iframe.html?id=components-tooltip--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Подробнее"});

    await trigger.focus();
    await expect(trigger).toBeFocused();

    const tooltip = page.getByRole("tooltip");

    await expect(tooltip).toBeVisible();

    await page.keyboard.press("Escape");
    /* closeDelay темы — 500 мс, до удаления пузырь ждёт его; toBeHidden сам дождётся. */
    await expect(tooltip).toBeHidden({timeout: 5000});
  });

  /*
   * Стрелка — OverlayArrow от RAC: svg с data-slot="overlay-arrow" внутри пузыря. Поворот под
   * нижнее placement (180deg) проверяется по вычисленному стилю — по классу он бы не читался,
   * поворот ставит атрибутное свойство rotate.
   */
  test("стрелка рендерится и разворачивается на placement=bottom", async ({page}) => {
    await page.goto("/iframe.html?id=components-tooltip--placements&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Снизу"});

    await warmPointerThenHover(page, trigger);

    const tooltip = page.getByRole("tooltip");
    const arrow = tooltip.locator('[data-slot="overlay-arrow"]');

    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveCSS("rotate", "180deg");
  });

  for (const theme of THEMES) {
    for (const id of STORIES) {
      test(`${id} не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

        /*
         * Признак готовности: холодный dev-сервер отдаёт пустой iframe раньше, чем история
         * отрендерится, и axe по пустой странице нашёл бы ноль нарушений — молча и зелёным.
         */
        await expect(page.getByRole("heading", {level: 2})).toBeVisible();

        await injectAxe(page);
        await checkA11y(page, undefined, {
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

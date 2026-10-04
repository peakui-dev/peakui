import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Popover. Здесь живёт ровно то, что jsdom подделывает: настоящая геометрия
 * позиционирования оверлея относительно триггера, настоящий возврат фокуса на триггер и реальный
 * portal в body.
 *
 * Аудит идёт по прямому адресу iframe (page.goto на /iframe.html), а не через манагер: injectAxe
 * доходит только до главного фрейма, и checkA11y по селектору фрейма проверял бы сам элемент iframe,
 * а не историю внутри него — см. ../AGENTS.md.
 */

const STORIES = [
  "components-popover--default",
  "components-popover--with-arrow",
  "components-popover--with-custom-content",
  "components-popover--on-surface",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

const openPopover = async (page: Page, trigger: Locator) => {
  /* Сначала готовность истории: до монтирования React клик ушёл бы в пустой iframe. */
  await expect(trigger).toBeVisible();
  await trigger.click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  return dialog;
};

test.describe("Popover — оверлей в настоящем браузере", () => {
  /*
   * Позиционирование — обещание оверлея, и оно существует только в настоящем layout'е: jsdom
   * отдаёт нулевые rect'ы. Дефолтное placement (bottom) обязано поставить пузырь ПОД триггером и
   * подписать data-placement — по нему CSS выбирает направление slide-in и поворот стрелки.
   */
  test("клик открывает диалог под триггером с data-placement=bottom", async ({page}) => {
    await page.goto("/iframe.html?id=components-popover--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Подробнее"});
    const overlay = page.locator('[data-slot="popover"]');
    const dialog = await openPopover(page, trigger);

    /* data-placement подписывает контейнер оверлея, не сам диалог внутри него. */
    await expect(overlay).toHaveAttribute("data-placement", "bottom");
    await expect(dialog).toContainText("Содержимое поповера");

    const [triggerBox, dialogBox] = await Promise.all([
      trigger.boundingBox(),
      page.locator('[data-slot="popover"]').boundingBox(),
    ]);

    expect(triggerBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    /* Верхняя кромка пузыря — ниже нижней кромки триггера, минус зазор offset. */
    expect(dialogBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 9);

    /*
     * Стили доехали, а не только имя класса: пузырь берёт фон у overlay-токена. Разъехалось бы
     * правило с именем — фон остался бы прозрачным, молча и без ошибки.
     */
    const background = await page
      .locator('[data-slot="popover"]')
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  /*
   * Раскрытие и закрытие — половина контракта доступности оверлея: фокус обязан заходить в диалог
   * при открытии и возвращаться на триггер по Escape. Это поведение RAC; тест охраняет его от
   * того, чтобы обёртка его случайно сломала.
   */
  test("фокус заходит в диалог и возвращается на триггер по Escape", async ({page}) => {
    await page.goto("/iframe.html?id=components-popover--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Подробнее"});
    const dialog = await openPopover(page, trigger);

    const dialogBox = await dialog.boundingBox();

    expect(dialogBox).not.toBeNull();
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  /*
   * Стрелка — OverlayArrow от RAC: svg с data-slot="popover-overlay-arrow" внутри пузыря.
   * Поворот под нижнее placement (180deg) проверяется по вычисленному стилю — по классу он бы не
   * читался, поворот ставит атрибутное свойство rotate.
   */
  test("стрелка рендерится и разворачивается на placement=bottom", async ({page}) => {
    await page.goto("/iframe.html?id=components-popover--with-arrow&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Подробнее"});
    const dialog = await openPopover(page, trigger);

    const arrow = dialog.locator('[data-slot="popover-overlay-arrow"]');

    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveCSS("rotate", "180deg");
  });

  /*
   * placement=right в истории «На поверхности» — та же геометрия вбок: пузырь справа от триггера.
   * Вместе с нижним это доказывает, что placement реально доезжает до позиционера.
   */
  test("placement=right ставит поповер справа от триггера", async ({page}) => {
    await page.goto("/iframe.html?id=components-popover--on-surface&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Справка"});
    const overlay = page.locator('[data-slot="popover"]');

    await openPopover(page, trigger);
    await expect(overlay).toHaveAttribute("data-placement", "right");

    const [triggerBox, dialogBox] = await Promise.all([
      trigger.boundingBox(),
      page.locator('[data-slot="popover"]').boundingBox(),
    ]);

    expect(triggerBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(dialogBox!.x).toBeGreaterThanOrEqual(triggerBox!.x + triggerBox!.width - 9);
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

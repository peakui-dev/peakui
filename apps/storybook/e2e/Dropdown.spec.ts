import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Dropdown. Здесь живёт ровно то, что jsdom подделывает: настоящая геометрия
 * позиционирования поповера относительно триггера, настоящий возврат фокуса и реальный portal
 * в body.
 *
 * Аудит идёт по прямому адресу iframe (page.goto на /iframe.html), а не через манагер: injectAxe
 * доходит только до главного фрейма, и checkA11y по селектору фрейма проверял бы сам элемент iframe,
 * а не историю внутри него — см. ../AGENTS.md.
 *
 * Аудит — по ОТКРЫТОМУ меню (волна 2, ревью): сначала открываем, только потом прогоняем axe —
 * закрытое меню не монтируется, и аудит молча прошёл бы пустую страницу.
 */

/*
 * У каждой истории триггер несёт aria-label="Меню" — он и есть доступное имя, содержимое кнопки
 * им перекрывается.
 */
const AUDITED_STORIES = [
  "components-dropdown--default",
  "components-dropdown--with-single-selection",
  "components-dropdown--with-multiple-selection",
  "components-dropdown--with-sections",
  "components-dropdown--with-submenus",
] as const;

const THEMES = ["default-light", "default-dark"] as const;

const openMenu = async (page: Page, trigger: Locator) => {
  /* Сначала готовность истории: до монтирования React клик ушёл бы в пустой iframe. */
  await expect(trigger).toBeVisible();
  await trigger.click();

  const menu = page.getByRole("menu");

  await expect(menu).toBeVisible();
  /*
   * Входная анимация fade-in-0 гоняет opacity от нуля, и axe, запущенный посередине, честно
   * меряет контраст полупрозрачного текста. Видимость — не готовность: ждём непрозрачности.
   */
  await expect(menu).toHaveCSS("opacity", "1");

  return menu;
};

test.describe("Dropdown — оверлей в настоящем браузере", () => {
  /*
   * Позиционирование — обещание оверлея, и оно существует только в настоящем layout'е: jsdom
   * отдаёт нулевые rect'ы. Дефолтное placement (bottom) обязано поставить меню ПОД триггером и
   * подписать data-placement — по нему CSS выбирает направление slide-in.
   */
  test("клик открывает меню под триггером с data-placement=bottom", async ({page}) => {
    await page.goto("/iframe.html?id=components-dropdown--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Меню"});
    const popover = page.locator('[data-slot="dropdown-popover"]');
    const menu = await openMenu(page, trigger);

    /* data-placement подписывает контейнер оверлея, не само меню внутри него. */
    await expect(popover).toHaveAttribute("data-placement", "bottom");
    await expect(menu).toHaveAttribute("data-slot", "dropdown-menu");
    await expect(page.getByRole("menuitem", {name: "Новый файл"})).toBeVisible();

    const [triggerBox, popoverBox] = await Promise.all([
      trigger.boundingBox(),
      popover.boundingBox(),
    ]);

    expect(triggerBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();
    /* Верхняя кромка меню — ниже нижней кромки триггера, минус зазор offset. */
    expect(popoverBox!.y).toBeGreaterThanOrEqual(triggerBox!.y + triggerBox!.height - 9);

    /*
     * Стили доехали, а не только имя класса: поповер берёт фон у overlay-токена. Разъехалось бы
     * правило с именем — фон остался бы прозрачным, молча и без ошибки.
     */
    const background = await popover.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  /*
   * Раскрытие и закрытие — половина контракта доступности оверлея: фокус обязан заходить в меню
   * при открытии и возвращаться на триггер по Escape. Это поведение RAC; тест охраняет его от
   * того, чтобы обёртка его случайно сломала.
   */
  test("фокус заходит в меню и возвращается на триггер по Escape", async ({page}) => {
    await page.goto("/iframe.html?id=components-dropdown--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Меню"});
    const menu = await openMenu(page, trigger);

    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  /*
   * Клавиатурный вход: стрелка вниз открывает меню от сфокусированного триггера, Enter активирует
   * элемент и меню закрывается — полный клавиатурный путь без указателя.
   */
  test("стрелка вниз открывает меню, Enter активирует элемент", async ({page}) => {
    await page.goto("/iframe.html?id=components-dropdown--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Меню"});

    await trigger.focus();
    await page.keyboard.press("ArrowDown");

    const menu = page.getByRole("menu");

    await expect(menu).toBeVisible();
    expect(await menu.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    await page.keyboard.press("Enter");

    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  for (const theme of THEMES) {
    for (const story of AUDITED_STORIES) {
      test(`${story} не нарушает WCAG 2.2 AA в теме ${theme} с открытым меню`, async ({page}) => {
        await page.goto(`/iframe.html?id=${story}&globals=theme:${theme}`);

        /*
         * Признак готовности: холодный dev-сервер отдаёт пустой iframe раньше, чем история
         * отрендерится, и axe по пустой странице нашёл бы ноль нарушений — молча и зелёным.
         */
        await expect(page.getByRole("heading", {level: 2})).toBeVisible();

        /* Сначала ОТКРЫВАЕМ меню: аудит гоняется по открытому оверлею, а не по триггеру. */
        await openMenu(page, page.getByRole("button", {name: "Меню"}));

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

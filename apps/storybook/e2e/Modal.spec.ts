import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Modal. Здесь живёт ровно то, что jsdom подделывает: настоящая геометрия
 * модального оверлея, настоящий захват фокуса внутри диалога и реальный portal в body.
 *
 * Аудит идёт по прямому адресу iframe (page.goto на /iframe.html), а не через манагер: injectAxe
 * доходит только до главного фрейма, и checkA11y по селектору фрейма проверял бы сам элемент iframe,
 * а не историю внутри него — см. ../AGENTS.md.
 *
 * Решение волны-2: аудит идёт по ОТКРЫТОМУ диалогу. Закрытая модалка — это кнопка на странице;
 * оверлей и его содержимое недоступны axe, пока диалог не открыт. Сначала открытие, потом
 * injectAxe/checkA11y.
 */

const STORIES_OPEN_AUDIT = [
  {id: "components-modal--default", trigger: "Открыть модалку"},
  {id: "components-modal--with-form", trigger: "Открыть форму"},
  {id: "components-modal--custom-trigger", trigger: "Настройки"},
] as const;

const THEMES = ["default-light", "default-dark"] as const;

const openModal = async (page: Page, trigger: Locator) => {
  /*
   * Сначала готовность истории: до монтирования React клик ушёл бы в пустой iframe. Таймаут
   * поднят против конфигового: первые тесты файла едят холодную компиляцию превью-бандла, и под
   * нагрузкой параллельных ворктри-агентов она длиннее 20 секунд.
   */
  await expect(trigger).toBeVisible({timeout: 60_000});
  await trigger.click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  return dialog;
};

test.describe("Modal — оверлей в настоящем браузере", () => {
  /* Тот же запас на холодный старт: таймаут теста не должен рвать ожидание выше. */
  test.setTimeout(150_000);

  /*
   * Геометрия — обещание модалки: подложка покрывает вьюпорт целиком, а диалог с размещением
   * auto стоит по центру и не вылезает за экран. jsdom отдаёт нулевые rect'ы, поэтому это здесь.
   */
  test("подложка покрывает вьюпорт, диалог центрирован и в пределах экрана", async ({page}) => {
    await page.goto("/iframe.html?id=components-modal--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Открыть модалку"});
    const backdrop = page.locator('[data-slot="modal-backdrop"]');
    const dialog = await openModal(page, trigger);

    const viewport = page.viewportSize()!;
    const [backdropBox, dialogBox] = await Promise.all([
      backdrop.boundingBox(),
      dialog.boundingBox(),
    ]);

    expect(backdropBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(backdropBox!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(backdropBox!.height).toBeGreaterThanOrEqual(viewport.height - 1);

    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport.height);

    const dialogCenterX = dialogBox!.x + dialogBox!.width / 2;

    expect(Math.abs(dialogCenterX - viewport.width / 2)).toBeLessThanOrEqual(1);

    /*
     * Стили доехали, а не только имя класса: диалог берёт фон у overlay-токена. Разъехалось бы
     * правило с именем — фон остался бы прозрачным, молча и без ошибки.
     */
    const background = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  /*
   * Захват фокуса — половина контракта модальности и то, что jsdom подделывает: Tab обязан
   * крутиться внутри диалога, сколько бы раз его ни нажали, и не выходить на страницу под
   * подложкой. Это поведение RAC; тест охраняет его от случайной поломки обёрткой.
   */
  test("Tab не выводит фокус за пределы диалога", async ({page}) => {
    await page.goto("/iframe.html?id=components-modal--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Открыть модалку"});
    const dialog = await openModal(page, trigger);

    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  /*
   * Раскрытие и возврат: фокус заходит в диалог при открытии и возвращается на триггер по
   * Escape — вторая половина контракта доступности оверлея.
   */
  test("фокус возвращается на триггер по Escape", async ({page}) => {
    await page.goto("/iframe.html?id=components-modal--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Открыть модалку"});
    const dialog = await openModal(page, trigger);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  /*
   * Клик по подложке закрывает диалог по умолчанию (isDismissable), а с isDismissable={false} —
   * нет: закрывать обязана только явная кнопка. Угол (10, 10) — область подложки вне контейнера.
   */
  test("клик по подложке закрывает, с isDismissable=false — нет", async ({page}) => {
    await page.goto("/iframe.html?id=components-modal--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Открыть модалку"});
    const dialog = await openModal(page, trigger);

    await page.mouse.click(10, 10);

    await expect(dialog).toBeHidden();

    await page.goto(
      "/iframe.html?id=components-modal--dismiss-behavior&globals=theme:default-light",
    );

    const stubborn = await openModal(
      page,
      page.getByRole("button", {name: "isDismissable = false"}),
    );

    await page.mouse.click(10, 10);

    await expect(stubborn).toBeVisible();

    /*
     * Клик по не-фокусируемой подложке уводит фокус из диалога, и Escape до слушателя оверлея
     * не доходит. Возвращаем фокус в диалог — как это делает контейнер фокуса RAC; захват фокуса
     * проверяется отдельным тестом выше, здесь проверяются только флаги закрытия.
     */
    await stubborn.focus();

    await page.keyboard.press("Escape");

    await expect(stubborn).toBeHidden();
  });

  /*
   * Аудит по ОТКРЫТОМУ диалогу в обеих темах (решение волны-2): сначала открытие, и только
   * потом injectAxe — по закрытой модалке аудит проверял бы одну кнопку на странице.
   */
  for (const theme of THEMES) {
    for (const story of STORIES_OPEN_AUDIT) {
      test(`${story.id} с открытым диалогом не нарушает WCAG 2.2 AA в теме ${theme}`, async ({
        page,
      }) => {
        await page.goto(`/iframe.html?id=${story.id}&globals=theme:${theme}`);

        const dialog = await openModal(page, page.getByRole("button", {name: story.trigger}));

        /* Признак готовности открытого состояния: диалог виден и получил фокус. */
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

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

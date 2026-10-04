import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Браузерный ярус Toast. Здесь живёт то, что jsdom подделывает: настоящие переходы входа и
 * выхода (exit держит тост смонтированным 300мс), укладка стека трансформами и раскрытие
 * стека по ховеру. Аудит — как у Popover, по прямому адресу iframe (см. ../AGENTS.md и
 * Popover.spec.ts), и обязательно по ОТКРЫТОМУ тосту: закрытый рендерит только кнопки.
 */

const THEMES = ["default-light", "default-dark"] as const;

/** Открывает постоянный тост (timeout: 0) в истории With Callbacks и ждёт регион. */
const openPersistentToast = async (page: Page) => {
  /* Сначала готовность истории: до монтирования React клик ушёл бы в пустой iframe. */
  const trigger = page.getByRole("button", {name: "Persistent toast"});

  /*
   * Холодный dev-сервер компилирует историю по первому запросу, и этот прогон дороже
   * дефолтных 20с ожидания (замерено локально); сигнал готовности один, ждём его тут.
   */
  await expect(trigger).toBeVisible({timeout: 90_000});
  await trigger.click();

  const toast = page.getByRole("alertdialog");

  await expect(toast).toBeVisible();

  /*
   * Регион — фиксированный ориентир нулевой высоты: тосты внутри него абсолютные, поэтому
   * проверяем контракт атрибутами, а не видимостью (в jsdom-ярусе то же самое).
   */
  const region = page.getByRole("region");

  await expect(region).toHaveAttribute("data-slot", "toast-region");

  return toast;
};

test.describe("Toast — оверлей в настоящем браузере", () => {
  /*
   * Все истории тостов живут в одном модуле, и первый тест платит за его холодную
   * компиляцию на dev-сервере — на свежем worktree это дольше дефолтных 30с теста.
   * Дальше трансформация закеширована и тесты идут секунды. На CI (test:e2e:ci)
   * Storybook предсобран, и запас никогда не тратится.
   */
  test.setTimeout(120_000);

  /*
   * Показ и закрытие — ядро контракта: тост появляется в регионе, кнопка Close раскрывается
   * по ховеру тоста и закрывает его; смонтированный призрак исчезает после exit-анимации.
   */
  test("показывает тост в регионе и закрывает его по Close", async ({page}) => {
    await page.goto("/iframe.html?id=components-toast--with-callbacks&globals=theme:default-light");

    const toast = await openPersistentToast(page);

    await expect(toast).toContainText("Important notification");
    await expect(toast).toHaveAttribute("data-frontmost", "true");

    /* Кнопка закрытия получает pointer-events только на ховере тоста. */
    await toast.hover();
    await page.getByRole("button", {exact: true, name: "Close"}).click();

    await expect(toast).toBeHidden();
  });

  /*
   * Принудительно раскрытый стек: три тоста, уложенные трансформами. Геометрия и data-index
   * существуют только в настоящем layout'е — jsdom отдаёт нулевые rect'ы.
   */
  test("укладывает три тоста в раскрытом стеке с data-index", async ({page}) => {
    await page.goto("/iframe.html?id=components-toast--expanded&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Show 3 toasts"});

    /* Холодный dev-сервер компилирует историю по первому запросу — см. openPersistentToast. */
    await expect(trigger).toBeVisible({timeout: 90_000});
    await trigger.click();

    const toasts = page.locator('[data-slot="toast"]');

    /* Тосты появляются ступенчато (0/400/800мс) — ждём все три. */
    await expect(toasts).toHaveCount(3);

    const region = page.getByRole("region");

    await expect(region).toHaveAttribute("data-expanded", "true");

    const indexes = await toasts.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-index")),
    );

    expect(indexes).toEqual(["0", "1", "2"]);

    const frontmostCount = await toasts.evaluateAll(
      (nodes) => nodes.filter((node) => node.getAttribute("data-frontmost") === "true").length,
    );

    expect(frontmostCount).toBe(1);
  });

  for (const theme of THEMES) {
    test(`открытый тост не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
      await page.goto(`/iframe.html?id=components-toast--with-callbacks&globals=theme:${theme}`);

      /* Сначала открытый тост — аудит закрытого состояния проверял бы только кнопки. */
      const toast: Locator = await openPersistentToast(page);

      await expect(toast).toContainText("Important notification");

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
});

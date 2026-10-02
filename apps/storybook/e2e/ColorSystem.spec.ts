import type {Page} from "@playwright/test";

import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Гейт страницы Color System. Его смысл — сделать невозможным дефект, из-за которого вся работа и
 * началась: страница эталона перечисляет 12 токенов, которых у него нет, и показывает их пустыми
 * плашками молча. Гейт висящих токенов в @peakui/styles читает var() в CSS и до имени, написанного
 * строкой в .tsx, не достаёт.
 *
 * Аудит идёт по прямому адресу iframe. Через манагер с селектором фрейма injectAxe доходит только
 * до главного фрейма и проверяет сам элемент iframe, а не историю внутри — эта ошибка здесь
 * однажды уже прошла и спрятала настоящий дефект контраста, см. ../AGENTS.md.
 */

const STORY = "foundations-color-system--all-colors";
const THEMES = ["default-light", "default-dark"] as const;
const VALUE = "[data-slot='computed-value']";

/** Токены, которых на странице нет намеренно: отложены вместе с выводом кольца фокуса. */
const DEFERRED = ["on-surface-focus", "on-surface-secondary-focus", "on-surface-tertiary-focus"];

const open = async (page: Page, theme: string) => {
  await page.goto(`/iframe.html?id=${STORY}&globals=theme:${theme}`);
  await expect(page.getByRole("heading", {level: 1})).toBeVisible();
  // Значения приходят после применения таблиц стилей, поэтому ждём первую ячейку, а не таймаут.
  await expect(page.locator(VALUE).first()).not.toBeEmpty();
};

test.describe("Color System", () => {
  for (const theme of THEMES) {
    test(`ни одной пустой плашки в теме ${theme}`, async ({page}) => {
      await open(page, theme);

      const empty = await page
        .locator(VALUE)
        .evaluateAll((cells) =>
          cells
            .filter((cell) => !(cell.textContent ?? "").trim())
            .map((cell) => (cell as HTMLElement).dataset["token"] ?? "?"),
        );

      expect(empty, `пустые значения: ${empty.join(", ")}`).toEqual([]);
    });
  }

  test("ни один токен не перечислен дважды", async ({page}) => {
    await open(page, THEMES[0]);

    const tokens = await page
      .locator(VALUE)
      .evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset["token"] ?? "?"));

    expect(new Set(tokens).size, "дубли на странице").toBe(tokens.length);
  });

  test("страница покрывает весь цветовой набор темы", async ({page}) => {
    await open(page, THEMES[0]);

    const listed = await page
      .locator(VALUE)
      .evaluateAll((cells) => cells.map((cell) => (cell as HTMLElement).dataset["token"] ?? "?"));

    /*
     * Источник истины — theme.css на диске, а НЕ таблицы стилей документа. Tailwind emit-ит
     * переменную --color-* только когда в просканированных исходниках встретилась её утилита,
     * поэтому браузер знает лишь часть набора: замер дал 26 имён против 77 объявленных. Сверка с
     * документом прошла бы вхолостую и ничего не доказала.
     */
    const themeCss = readFileSync(
      resolve(import.meta.dirname, "../../../packages/styles/themes/shared/theme.css"),
      "utf8",
    );
    const declared = [...themeCss.matchAll(/^\s*--color-([\w-]+):/gm)].map((match) => match[1]!);

    expect(declared.length, "имена --color-* в theme.css").toBeGreaterThan(50);

    for (const token of declared) {
      if (DEFERRED.includes(token)) continue;

      expect(listed, `${token} объявлен в theme.css, но не перечислен на странице`).toContain(
        token,
      );
    }

    // И обратно: страница не перечисляет ничего, чего в наборе нет.
    for (const token of listed) {
      expect(declared, `${token} перечислен на странице, но в theme.css его нет`).toContain(token);
    }
  });

  test("переключение темы меняет значения, а не оставляет прежние", async ({page}) => {
    await open(page, "default-light");
    const light = await page.locator(VALUE).first().textContent();

    await open(page, "default-dark");
    const dark = await page.locator(VALUE).first().textContent();

    expect(dark).not.toBe(light);
  });

  for (const theme of THEMES) {
    test(`не нарушает WCAG 2.2 AA в теме ${theme}`, async ({page}) => {
      await open(page, theme);
      await injectAxe(page);
      await checkA11y(page, undefined, {
        axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
        detailedReport: true,
      });
    });
  }
});

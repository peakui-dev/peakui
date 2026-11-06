import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Forced-colors (Windows High Contrast) snapshots and a story sweep.
 *
 * The baselines encode Chromium's EMULATED forced-colors rendering, which is not identical to
 * what Windows draws: for one, the emulation paints a white backplate behind HighlightText
 * labels that sit on a Highlight fill. A snapshot diff therefore means "the emulated rendering
 * changed", and a baseline is a regression guard, not a claim about the real High Contrast theme.
 *
 * Baselines are platform-specific (Playwright suffixes them with -<project>-<platform>), so
 * they were generated on Windows and a Linux CI run needs its own set.
 *
 * Every case opens the story iframe directly, as foundations.a11y.spec.ts explains: the page is
 * the story, and axe/screenshot see the story rather than the manager chrome.
 */

test.use({colorScheme: "light", forcedColors: "active", viewport: {height: 360, width: 640}});

async function openStory(page: Page, id: string): Promise<void> {
  await page.goto(`/iframe.html?id=${id}&globals=theme:default-light`);
  await expect(page.locator("#storybook-root > *").first()).toBeVisible();
  // Let fonts and the Tabs indicator settle before pixels are compared.
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Forced colors (browser)", () => {
  test("флажок: отмечен и не отмечен различимы", async ({page}) => {
    await openStory(page, "components-checkbox--indeterminate-forced");
    await expect(page).toHaveScreenshot("checkbox-forced.png");
  });

  test("флажок: неопределённое, выключенное и неверное состояния", async ({page}) => {
    for (const [name, id] of [
      ["checkbox-disabled-checked", "components-checkbox--disabled-checked"],
      ["checkbox-invalid-checked", "components-checkbox--invalid-checked"],
      ["radio-disabled-checked", "components-radiogroup--disabled-checked"],
      ["radio-invalid-checked", "components-radiogroup--invalid-checked"],
      ["switch-disabled-checked", "components-switch--disabled-checked"],
      ["switch-invalid-checked", "components-switch--invalid-checked"],
    ] as const) {
      await openStory(page, id);
      await expect(page).toHaveScreenshot(`${name}.png`);
    }
  });

  test("вкладки: выбранная вкладка, в том числе выключенная", async ({page}) => {
    await openStory(page, "components-tabs--disabled-selected-tab");
    await expect(page).toHaveScreenshot("tabs-disabled-selected.png");
  });

  test("слайдер: середина диапазона", async ({page}) => {
    await openStory(page, "components-slider--mid-range");
    await expect(page).toHaveScreenshot("slider-mid-range.png");
  });

  test("сквозной проход по историям без нарушений axe", async ({page}) => {
    for (const id of [
      "components-checkbox--indeterminate-forced",
      "components-checkbox--disabled-checked",
      "components-checkbox--invalid-checked",
      "components-radiogroup--disabled-checked",
      "components-radiogroup--invalid-checked",
      "components-switch--disabled-checked",
      "components-switch--invalid-checked",
      "components-tabs--disabled-selected-tab",
      "components-slider--mid-range",
    ]) {
      await openStory(page, id);
      await injectAxe(page);
      await checkA11y(page, undefined, {
        axeOptions: {runOnly: ["wcag2a", "wcag2aa"]},
        detailedReport: true,
      });
    }
  });
});

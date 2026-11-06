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

/* One test per story, so a failure in one state does not hide the others. */
const SNAPSHOTS = [
  ["checkbox: checked, unchecked and indeterminate are distinguishable", "checkbox-forced", "components-checkbox--indeterminate-forced"],
  ["checkbox: disabled and checked", "checkbox-disabled-checked", "components-checkbox--disabled-checked"],
  ["checkbox: invalid and checked", "checkbox-invalid-checked", "components-checkbox--invalid-checked"],
  ["radio: disabled and checked", "radio-disabled-checked", "components-radiogroup--disabled-checked"],
  ["radio: invalid and checked", "radio-invalid-checked", "components-radiogroup--invalid-checked"],
  ["switch: disabled and on", "switch-disabled-checked", "components-switch--disabled-checked"],
  ["switch: invalid and on", "switch-invalid-checked", "components-switch--invalid-checked"],
  ["tabs: selected tab, including a disabled one", "tabs-disabled-selected", "components-tabs--disabled-selected-tab"],
  ["tabs: default selected tab", "tabs-default", "components-tabs--default"],
  ["slider: mid-range", "slider-mid-range", "components-slider--mid-range"],
] as const;

test.describe("Forced colors (browser)", () => {
  for (const [title, name, id] of SNAPSHOTS) {
    test(`snapshot, ${title}`, async ({page}) => {
      await openStory(page, id);
      await expect(page).toHaveScreenshot(`${name}.png`);
    });

    test(`axe, ${title}`, async ({page}) => {
      await openStory(page, id);
      await injectAxe(page);
      await checkA11y(page, undefined, {
        axeOptions: {runOnly: ["wcag2a", "wcag2aa"]},
        detailedReport: true,
      });
    });
  }
});

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier for Typography. The component sets colours and sizes and nothing else, so the one
 * thing jsdom cannot judge is contrast: the muted colour and the code chip against the page.
 *
 * Every test opens the iframe URL directly: the page is the preview document.
 */

const STORIES = [
  ["Default", "components-typography--default"],
  ["Headings", "components-typography--headings"],
  ["Paragraphs", "components-typography--paragraphs"],
  ["Code", "components-typography--inline"],
  ["Muted and weights", "components-typography--muted-and-weights"],
  ["Prose", "components-typography--prose-block"],
] as const;

/* A cold dev server compiles the preview on the first request, longer than the default window. */
const COLD = {timeout: 60_000} as const;

test.describe.configure({mode: "default"});

test.describe("Typography (browser)", () => {
  test.setTimeout(150_000);

  test("heading levels get distinct sizes from the type scale", async ({page}) => {
    await page.goto("/iframe.html?id=components-typography--headings&globals=theme:default-light");

    const first = page.locator('[data-slot="typography"][data-type="h1"]');

    await expect(first).toBeVisible(COLD);

    const sizes = await page
      .locator('[data-slot="typography"]')
      .evaluateAll((elements) =>
        elements.map((element) => parseFloat(getComputedStyle(element).fontSize)),
      );

    /* text-4xl down to text-base: six levels, strictly shrinking, none the 16px body default. */
    expect(sizes).toHaveLength(6);
    expect(sizes[0]).toBe(36);
    expect(sizes).toEqual([...sizes].sort((a, b) => b - a));
    expect(new Set(sizes.slice(0, 5)).size).toBe(5);
  });

  for (const theme of ["default-light", "default-dark"] as const) {
    for (const [name, id] of STORIES) {
      test(`${name} breaks no WCAG 2.2 AA rule in ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);
        await expect(page.getByRole("heading", {level: 2, name})).toBeVisible(COLD);

        await injectAxe(page);
        await checkA11y(page, undefined, {
          axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
          detailedReport: true,
        });
      });
    }
  }
});

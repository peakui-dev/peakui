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

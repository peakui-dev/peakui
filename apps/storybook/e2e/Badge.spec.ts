import type {Locator} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier for Badge. jsdom computes no geometry and no media features, and what can go wrong
 * here is exactly that: the badge landing in the wrong corner of its anchor, the badge losing its
 * edge under forced colors where the fill is erased, and the badge's own shape — a label wide
 * enough to need a rounded rectangle rendering as a circle stretched out of shape instead.
 *
 * Every test opens the iframe URL directly: the page is the preview document.
 */

const STORY = {
  colors: "components-badge--colors",
  content: "components-badge--content",
  default: "components-badge--default",
  dot: "components-badge--dot",
  onButton: "components-badge--on-button",
  placements: "components-badge--placements",
  sizes: "components-badge--sizes",
} as const;

const iframe = (id: string, theme: "default-dark" | "default-light" = "default-light") =>
  `/iframe.html?id=${id}&globals=theme:${theme}`;

/* A cold dev server compiles the preview on the first request, longer than the default window. */
const COLD = {timeout: 60_000} as const;

test.describe.configure({mode: "default"});

test.describe("Badge (browser)", () => {
  test.setTimeout(150_000);

  test("the badge keeps a visible edge under forced colors", async ({page}) => {
    await page.emulateMedia({forcedColors: "active"});
    await page.goto(iframe(STORY.default));

    const badge = page.locator('[data-slot="badge"]').first();

    await expect(badge).toBeVisible(COLD);

    const {border, canvas, style} = await badge.evaluate((element) => ({
      border: getComputedStyle(element).borderTopColor,
      canvas: getComputedStyle(document.body).backgroundColor,
      style: getComputedStyle(element).borderTopStyle,
    }));

    expect(style).toBe("solid");
    expect(border).not.toBe(canvas);
  });

  /*
   * Shape. A badge's width is driven by its label, its height by the size variant, so a label of
   * several characters must outgrow the square the min-width floor starts from. A single
   * character, and a badge with no children at all, must not: a count and a status dot are
   * circles on purpose.
   */
  const boxOf = async (locator: Locator) => {
    await expect(locator).toBeVisible(COLD);

    const box = await locator.boundingBox();

    if (!box) throw new Error("the badge has no box");

    return box;
  };

  test("a multi-character badge is wider than it is tall", async ({page}) => {
    await page.goto(iframe(STORY.content));

    const box = await boxOf(page.locator('[data-slot="badge"]', {hasText: "New"}).first());

    expect(box.width / box.height).toBeGreaterThanOrEqual(1.5);
  });

  test("a single-character badge stays a circle", async ({page}) => {
    await page.goto(iframe(STORY.content));

    const box = await boxOf(page.locator('[data-slot="badge"]', {hasText: "5"}).first());

    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
  });

  test("a childless badge stays a circle", async ({page}) => {
    await page.goto(iframe(STORY.dot));

    const box = await boxOf(page.locator('[data-slot="badge"]').first());

    expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
  });

  test("the three sizes stay strictly ordered", async ({page}) => {
    await page.goto(iframe(STORY.sizes));

    await expect(page.locator('[data-slot="badge"]').first()).toBeVisible(COLD);

    const heights = await page
      .locator('[data-slot="badge"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().height));

    expect(heights).toEqual([...heights].sort((a, b) => a - b));
    expect(new Set(heights).size).toBe(3);
  });

  for (const dir of ["ltr", "rtl"] as const) {
    test(`top-right is the top right corner of the anchor on a ${dir} page`, async ({page}) => {
      await page.goto(iframe(STORY.default));

      const badge = page.locator('[data-slot="badge"]').first();

      await expect(badge).toBeVisible(COLD);
      await page.evaluate((direction) => {
        document.documentElement.dir = direction;
      }, dir);

      const {anchor, indicator} = await badge.evaluate((element) => {
        const anchorElement = element.closest('[data-slot="badge-anchor"]');

        if (!anchorElement) throw new Error("the badge has no anchor");

        const anchorBox = anchorElement.getBoundingClientRect();
        const box = element.getBoundingClientRect();

        return {
          anchor: {right: anchorBox.right, top: anchorBox.top},
          indicator: {
            centerX: box.left + box.width / 2,
            centerY: box.top + box.height / 2,
            height: box.height,
            width: box.width,
          },
        };
      });

      /* translate(25%, -25%) from the top right corner: the centre sits a quarter of the badge inside it. */
      expect(indicator.centerX).toBeCloseTo(anchor.right - indicator.width * 0.25, 0);
      expect(indicator.centerY).toBeCloseTo(anchor.top + indicator.height * 0.25, 0);
    });
  }

  for (const theme of ["default-light", "default-dark"] as const) {
    for (const [name, id] of [
      ["Badge", STORY.default],
      ["Badge placements", STORY.placements],
      ["Badge colors and variants", STORY.colors],
      ["Badge sizes", STORY.sizes],
      ["Badge dot", STORY.dot],
      ["Badge content", STORY.content],
      ["Badge on a button", STORY.onButton],
    ] as const) {
      test(`${name} breaks no WCAG 2.2 AA rule in ${theme}`, async ({page}) => {
        await page.goto(iframe(id, theme));
        await expect(page.getByRole("heading", {level: 2})).toBeVisible(COLD);

        await injectAxe(page);
        await checkA11y(page, undefined, {
          axeOptions: {runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]}},
          detailedReport: true,
        });
      });
    }
  }
});

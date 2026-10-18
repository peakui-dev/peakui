import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier for Meter. jsdom computes no geometry and no media features, and the three things
 * that can go wrong here are exactly those: the empty "label / output" grid row still spending the
 * row gap, the fill vanishing into the track under forced colors, and the fill growing from the
 * wrong edge on an RTL page.
 *
 * Every test opens the iframe URL directly: the page is the preview document.
 */

const STORY = {
  colors: "components-meter--colors",
  customValue: "components-meter--custom-value",
  default: "components-meter--default",
  sizes: "components-meter--sizes",
  withoutLabel: "components-meter--without-label",
} as const;

const iframe = (id: string, theme: "default-dark" | "default-light" = "default-light") =>
  `/iframe.html?id=${id}&globals=theme:${theme}`;

/* A cold dev server compiles the preview on the first request, longer than the default window. */
const COLD = {timeout: 60_000} as const;

test.describe.configure({mode: "default"});

test.describe("Meter (browser)", () => {
  test.setTimeout(150_000);

  test("without a label or an output the track sits at the top of the component", async ({
    page,
  }) => {
    await page.goto(iframe(STORY.withoutLabel));

    const meter = page.getByRole("meter", {name: "Storage used"});

    await expect(meter).toBeVisible(COLD);

    const {root, track} = await meter.evaluate((element) => {
      const trackElement = element.querySelector('[data-slot="meter-track"]');

      if (!trackElement) throw new Error("the meter has no track");

      return {
        root: element.getBoundingClientRect().top,
        track: trackElement.getBoundingClientRect().top,
      };
    });

    expect(track).toBe(root);
  });

  /*
   * The accent fill is Highlight under forced colors through the theme alone, so it proves
   * nothing about this component's rules. The success, warning and danger fills are plain colours
   * that forced colors flattens, and those are the ones the pinned Highlight fill exists for.
   */
  for (const color of ["success", "warning", "danger"] as const) {
    test(`the ${color} fill stays distinguishable from the track under forced colors`, async ({
      page,
    }) => {
      await page.emulateMedia({forcedColors: "active"});
      await page.goto(iframe(STORY.colors));

      const meter = page.getByRole("meter", {name: color});

      await expect(meter).toBeVisible(COLD);

      const {fill, outline, track} = await meter.evaluate((element) => {
        const fillElement = element.querySelector('[data-slot="meter-fill"]');
        const trackElement = element.querySelector('[data-slot="meter-track"]');

        if (!fillElement || !trackElement) throw new Error("the meter lacks a fill or a track");

        return {
          fill: getComputedStyle(fillElement).backgroundColor,
          outline: getComputedStyle(trackElement).outlineStyle,
          track: getComputedStyle(trackElement).backgroundColor,
        };
      });

      expect(outline).toBe("solid");
      expect(fill).not.toBe(track);
    });
  }

  test("on an RTL page the fill grows from the inline start, the right edge", async ({page}) => {
    await page.goto(iframe(STORY.default));

    const meter = page.getByRole("meter");

    await expect(meter).toBeVisible(COLD);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });

    const {fill, track} = await meter.evaluate((element) => {
      const fillElement = element.querySelector('[data-slot="meter-fill"]');
      const trackElement = element.querySelector('[data-slot="meter-track"]');

      if (!fillElement || !trackElement) throw new Error("the meter lacks a fill or a track");

      return {
        fill: fillElement.getBoundingClientRect().right,
        track: trackElement.getBoundingClientRect().right,
      };
    });

    expect(fill).toBeCloseTo(track, 0);
  });

  for (const theme of ["default-light", "default-dark"] as const) {
    for (const [name, id] of [
      ["Meter", STORY.default],
      ["Meter sizes", STORY.sizes],
      ["Meter colors", STORY.colors],
      ["Meter custom value", STORY.customValue],
      ["Meter without a label", STORY.withoutLabel],
    ] as const) {
      test(`${name} breaks no WCAG 2.2 AA rule in ${theme}`, async ({page}) => {
        await page.goto(iframe(id, theme));
        await expect(page.getByRole("heading", {level: 2})).toBeVisible(COLD);

        await injectAxe(page);
        /*
         * One rule off, with its measurement: React Aria renders `role="meter progressbar"`, a
         * role fallback list for assistive technology that does not know `meter`. axe does not
         * parse the list and reports aria-valuenow / -valuemin / -valuemax / -valuetext as not
         * allowed on it, although WAI-ARIA 1.2 allows all four on `meter`. The jsdom suite pins
         * that the role starts with `meter` and that aria-valuenow is set. Every other rule stays
         * on. Lift this when axe resolves role fallback lists.
         */
        await checkA11y(page, undefined, {
          axeOptions: {
            rules: {"aria-allowed-attr": {enabled: false}},
            runOnly: {type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"]},
          },
          detailedReport: true,
        });
      });
    }
  }
});

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier for ProgressCircle. jsdom evaluates no media features, and the two things that can
 * go wrong here are exactly those: the arc vanishing into the ring under forced colors, and the
 * indeterminate spin ignoring `prefers-reduced-motion`.
 *
 * Every test opens the iframe URL directly: the page is the preview document.
 */

const STORY = {
  colors: "components-progresscircle--colors",
  default: "components-progresscircle--default",
  indeterminate: "components-progresscircle--indeterminate",
  sizes: "components-progresscircle--sizes",
  withLabel: "components-progresscircle--with-label",
} as const;

const iframe = (id: string, theme: "default-dark" | "default-light" = "default-light") =>
  `/iframe.html?id=${id}&globals=theme:${theme}`;

/* A cold dev server compiles the preview on the first request, longer than the default window. */
const COLD = {timeout: 60_000} as const;

test.describe.configure({mode: "default"});

test.describe("ProgressCircle (browser)", () => {
  test.setTimeout(150_000);

  /*
   * The accent arc is Highlight under forced colors through the theme alone, so it proves nothing
   * about this component's rules. The success, warning and danger arcs keep the theme's own colour
   * in Chromium's emulation (measured: oklch(0.52 0.17 27) for danger, an SVG stroke is not
   * adjusted), so without the component's Highlight stroke they ignore the user's palette. The
   * test pins the arc to a system colour that is neither the ring nor the page.
   */
  for (const color of ["success", "warning", "danger"] as const) {
    test(`the ${color} arc stays visible against the ring and the page under forced colors`, async ({
      page,
    }) => {
      await page.emulateMedia({forcedColors: "active"});
      await page.goto(iframe(STORY.colors));

      const circle = page.getByRole("progressbar", {name: color});

      await expect(circle).toBeVisible(COLD);

      const {arc, canvas, ring} = await circle.evaluate((element) => {
        const arcElement = element.querySelector('[data-slot="progress-circle-fill-circle"]');
        const ringElement = element.querySelector('[data-slot="progress-circle-track-circle"]');

        if (!arcElement || !ringElement) throw new Error("the circle lacks an arc or a ring");

        return {
          arc: getComputedStyle(arcElement).stroke,
          canvas: getComputedStyle(document.body).backgroundColor,
          ring: getComputedStyle(ringElement).stroke,
        };
      });

      /* A system colour resolves to rgb(); the theme's own oklch() means the rule is missing. */
      expect(arc).toMatch(/^rgb\(/);
      expect(arc).not.toBe(ring);
      expect(arc).not.toBe(canvas);
    });
  }

  test("the indeterminate spin runs, and stops under reduced motion", async ({page}) => {
    await page.goto(iframe(STORY.indeterminate));

    const circle = page.getByRole("progressbar", {name: "Loading"});

    await expect(circle).toBeVisible(COLD);

    const spinning = await circle.evaluate(
      (element) =>
        getComputedStyle(element.querySelector('[data-slot="progress-circle-track"]')!)
          .animationName,
    );

    expect(spinning).toBe("progress-circle-spin");

    await page.emulateMedia({reducedMotion: "reduce"});

    const resting = await circle.evaluate(
      (element) =>
        getComputedStyle(element.querySelector('[data-slot="progress-circle-track"]')!)
          .animationName,
    );

    expect(resting).toBe("none");
  });

  for (const theme of ["default-light", "default-dark"] as const) {
    for (const [name, id] of [
      ["ProgressCircle", STORY.default],
      ["ProgressCircle sizes", STORY.sizes],
      ["ProgressCircle colors", STORY.colors],
      ["ProgressCircle indeterminate", STORY.indeterminate],
      ["ProgressCircle with a label", STORY.withLabel],
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

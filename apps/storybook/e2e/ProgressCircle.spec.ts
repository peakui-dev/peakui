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

  test("the arc and the ring take different system colors under forced colors", async ({page}) => {
    await page.emulateMedia({forcedColors: "active"});
    await page.goto(iframe(STORY.default));

    const circle = page.getByRole("progressbar", {name: "Loading"});

    await expect(circle).toBeVisible(COLD);

    const {arc, ring} = await circle.evaluate((element) => {
      const arcElement = element.querySelector('[data-slot="progress-circle-fill-circle"]');
      const ringElement = element.querySelector('[data-slot="progress-circle-track-circle"]');

      if (!arcElement || !ringElement) throw new Error("the circle lacks an arc or a ring");

      return {
        arc: getComputedStyle(arcElement).stroke,
        ring: getComputedStyle(ringElement).stroke,
      };
    });

    expect(arc).not.toBe("none");
    expect(ring).not.toBe("none");
    expect(arc).not.toBe(ring);
  });

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

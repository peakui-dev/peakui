import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier of Sheet, in Chromium and WebKit. The sheet moves by scrolling an oversized
 * scroll-snap container, so everything here is what jsdom cannot run: native snapping, the
 * scroll-driven enter and exit, the pointer drag on the handle, forced colors and reduced motion.
 *
 * Stories are opened by the iframe URL, not through the manager: injectAxe reaches only the main
 * frame (see ../AGENTS.md).
 *
 * Geometry is read once the dialog's box has stood still for a run of frames: until the enter has
 * settled, the box is wherever the scroll has got to.
 *
 * Known limitation, documented rather than tested: a parent and a nested sheet mounted open
 * together stack in effect order, which puts the parent on top (see the Nested story).
 *
 * WebKit is opt-in (see playwright.config.ts): `pnpm --filter @peakui/storybook test:e2e:webkit`,
 * after a one-time `pnpm --filter @peakui/storybook exec playwright install webkit`.
 */

const THEMES = ["default-light", "default-dark"] as const;

/* A cold dev server compiles the preview bundle on the first request of each worker. */
const COLD = {timeout: 60_000} as const;

/* Box geometry is compared within a pixel: subpixel layout and rounding. */
const PX = 1;

/* The handle's and the close button's labels are localized: pin the names to English. */
test.use({locale: "en-US"});

const goto = async (page: Page, id: string, theme: string = "default-light") => {
  await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);
  /* Every story renders a level-two heading: the sign that the preview mounted. */
  await expect(page.getByRole("heading", {level: 2})).toBeVisible(COLD);
};

/** Resolves once the element's box has not changed for `frames` animation frames in a row. */
const settled = async (target: Locator, frames = 10) => {
  await target.evaluate(
    (element, needed) =>
      new Promise<void>((resolve, reject) => {
        let previous = "";
        let still = 0;
        let count = 0;
        const tick = () => {
          const r = element.getBoundingClientRect();
          const key = `${r.x},${r.y},${r.width},${r.height}`;

          still = key === previous ? still + 1 : 0;
          previous = key;
          count += 1;
          if (still >= needed) resolve();
          else if (count > 1200) reject(new Error(`box never settled: ${key}`));
          else requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    frames,
  );

  return (await target.boundingBox())!;
};

const open = async (page: Page, trigger: string, name?: string) => {
  await page.getByRole("button", {name: trigger}).click();

  const dialog = name ? page.getByRole("dialog", {name}) : page.getByRole("dialog");

  await expect(dialog).toBeVisible();
  /* The enter is over once focus has moved inside: the primitive defers it until then. */
  await expect.poll(() => focusInside(dialog)).toBe(true);

  return dialog;
};

const focusInside = (dialog: Locator) =>
  dialog.evaluate((element) => element.contains(document.activeElement));

const viewport = (page: Page) => page.viewportSize()!;

/** How much of a bottom sheet shows: from its top edge down to the viewport's bottom. */
const revealed = (page: Page, box: {y: number}) => viewport(page).height - box.y;

const scroller = (page: Page) => page.locator("[data-sheet-scroll]").first();

const handle = (page: Page) => page.locator('[data-slot="sheet-handle"]').first();

/** A slow mouse drag on the handle that rests before letting go, so no flick is read. */
const dragHandle = async (page: Page, dy: number, dx = 0) => {
  const box = (await handle(page).boundingBox())!;
  const {height, width} = viewport(page);
  /* The middle of the part on screen: a partial sheet leaves the rest of its handle off it. */
  const x = (Math.max(box.x, 0) + Math.min(box.x + box.width, width)) / 2;
  const y = (Math.max(box.y, 0) + Math.min(box.y + box.height, height)) / 2;

  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, {steps: 20});
  /* The flick window is 100 ms of stillness: this hold is the thing that rules a flick out. */
  await page.waitForTimeout(200);
  await page.mouse.up();
};

/** Tab until the handle has focus; the slider sits in the tab order of the dialog. */
const focusHandle = async (page: Page) => {
  for (let i = 0; i < 8; i++) {
    if (await handle(page).evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }

  await expect(handle(page)).toBeFocused();
};

test.describe("Sheet: overlay in a real browser", () => {
  test.setTimeout(150_000);

  test("scroll-snap settles at the first snap point on open", async ({page}) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const box = await settled(dialog);

    /* The snap sheet is full height; its first point reveals a quarter of it. */
    expect(Math.abs(box.height - viewport(page).height)).toBeLessThanOrEqual(PX);
    expect(Math.abs(revealed(page, box) - box.height * 0.25)).toBeLessThanOrEqual(PX);
    await expect(page.getByRole("slider", {name: "Resize sheet"})).toHaveAttribute(
      "aria-valuenow",
      "25",
    );
  });

  test("handle drag releases on the nearest snap point", async ({page}) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const start = await settled(dialog);

    /* From a quarter, pull up a fifth of the sheet: half is the nearest resting place. */
    await dragHandle(page, -start.height * 0.2);

    const box = await settled(dialog);

    expect(Math.abs(revealed(page, box) - box.height * 0.5)).toBeLessThanOrEqual(PX);
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "50");
    /* Released means released: the scroller is not left held with snapping off. */
    await expect(scroller(page)).not.toHaveAttribute("data-handle-dragging");
    await expect(handle(page)).not.toHaveAttribute("data-dragging");
  });

  test("drag past the lowest snap dismisses", async ({page}) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const start = await settled(dialog);

    await dragHandle(page, revealed(page, start) * 0.8);

    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", {name: "Open with snap points"})).toBeFocused();
  });

  test("swipe to dismiss", async ({browserName, page}) => {
    await goto(page, "components-sheet--default");

    /* Make the page behind scrollable, so a drag that leaked to it would show as a scroll. */
    await page.addStyleTag({content: "body { min-height: 3000px; }"});

    const dialog = await open(page, "Open sheet");
    const start = await settled(dialog);
    const bar = (await handle(page).boundingBox())!;
    const x = Math.round(bar.x + bar.width / 2);
    const y = Math.round(bar.y + bar.height / 2);
    const pageScroll = () => page.evaluate(() => window.scrollY);

    if (browserName === "chromium") {
      /* A real touch sequence through CDP: touchstart, a slow move down, touchend. */
      const client = await page.context().newCDPSession(page);
      const touch = (
        type: "touchEnd" | "touchMove" | "touchStart",
        points: {x: number; y: number}[],
      ) => client.send("Input.dispatchTouchEvent", {touchPoints: points, type});

      await touch("touchStart", [{x, y}]);
      for (let step = 1; step <= 20; step++) {
        await touch("touchMove", [{x, y: y + Math.round((start.height * 0.8 * step) / 20)}]);
      }
      await page.waitForTimeout(200);
      await touch("touchEnd", []);
    } else {
      /*
       * WebKit: Playwright has no touch-move API there (page.touchscreen only taps, and CDP is
       * Chromium's), so the same release is driven by the mouse path of the handle.
       */
      await dragHandle(page, start.height * 0.8);
    }

    await expect(dialog).toBeHidden();
    expect(await pageScroll()).toBe(0);
  });

  const nestedScaleBack = async (page: Page, reducedMotion: "no-preference" | "reduce") => {
    await page.emulateMedia({reducedMotion});
    await goto(page, "components-sheet--nested");

    const parent = await open(page, "Open parent sheet", "Parent sheet");
    const before = await settled(parent);
    const content = page.locator('[data-slot="sheet-content"]').first();

    /*
     * The drawn scale of the parent's content: its computed transform (the perspective and the
     * stack animation's translateZ) applied to a 100px segment and projected. Read from the matrix
     * because WebKit's getBoundingClientRect does not project a perspective transform.
     */
    const drawnScale = () =>
      content.evaluate((element) => {
        const transform = getComputedStyle(element).transform;
        const matrix = new DOMMatrix(transform === "none" ? undefined : transform);
        const a = matrix.transformPoint(new DOMPoint(0, 0, 0, 1));
        const b = matrix.transformPoint(new DOMPoint(100, 0, 0, 1));

        return (b.x / b.w - a.x / a.w) / 100;
      });

    expect(await drawnScale()).toBeCloseTo(1, 3);

    /* The content's untransformed box, and where the panel's top edge sits inside it. */
    const layout = (await content.boundingBox())!;

    /*
     * Where the panel's top edge is drawn: its corner projected through the computed transform
     * about the computed transform-origin, as the browser draws it.
     */
    const drawnTop = () =>
      content.evaluate(
        (element, {box, local}) => {
          const style = getComputedStyle(element);
          const matrix = new DOMMatrix(style.transform === "none" ? undefined : style.transform);
          const [ox = 0, oy = 0] = style.transformOrigin.split(" ").map(parseFloat);
          const point = matrix.transformPoint(new DOMPoint(local.x - ox, local.y - oy, 0, 1));

          return box.y + oy + point.y / point.w;
        },
        {box: layout, local: {x: before.x - layout.x, y: before.y - layout.y}},
      );
    const dim = () =>
      content.evaluate((element) => {
        const match = /brightness\(([\d.]+)\)/.exec(getComputedStyle(element).filter);

        return match ? Number(match[1]) : 1;
      });

    expect(await dim()).toBe(1);

    const child = await open(page, "Open nested sheet", "Nested sheet");
    const childBox = await settled(child);

    await settled(content);

    /* translateZ(-120px) under perspective(1000px): drawn at 1000 / 1120 of its size. */
    expect(await drawnScale()).toBeCloseTo(1000 / 1120, 2);
    /* The point of the scale-back: a strip of the receded parent stays in sight above the child. */
    expect(await drawnTop()).toBeLessThan(childBox.y - 8);
    /* And it is dimmed, so the child reads as the one on top. */
    expect(await dim()).toBeLessThan(0.95);

    await page.keyboard.press("Escape");
    await expect(child).toBeHidden();
    await expect(parent).toBeVisible();

    const restored = await settled(parent);

    expect(await drawnScale()).toBeCloseTo(1, 3);
    expect(await dim()).toBe(1);
    expect(Math.abs(restored.width - before.width)).toBeLessThanOrEqual(PX);
    expect(Math.abs(restored.x - before.x)).toBeLessThanOrEqual(PX);
    expect(Math.abs(restored.y - before.y)).toBeLessThanOrEqual(PX);
    /* Escape closed only the topmost sheet, and focus is back in the parent. */
    await expect.poll(() => focusInside(parent)).toBe(true);
  };

  test("nested sheet scales the parent back and restores it on close", ({page}) =>
    nestedScaleBack(page, "no-preference"));

  /*
   * Under reduced motion the transition goes, not the end state: the parent still recedes and dims
   * while the child is open, at once instead of with the child's scroll.
   */
  test("nested sheet under reduced motion scales the parent back and restores it on close", ({
    page,
  }) => nestedScaleBack(page, "reduce"));

  test("placements: four edges", async ({page}) => {
    await goto(page, "components-sheet--placements");

    const {height, width} = viewport(page);

    for (const placement of ["bottom", "top", "left", "right"] as const) {
      const dialog = await open(page, `Open ${placement}`);
      const box = await settled(dialog);

      if (placement === "bottom") {
        expect(Math.abs(box.y + box.height - height)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.width - width)).toBeLessThanOrEqual(PX);
        /* Without snap points a bottom sheet is as tall as its content, not the viewport. */
        expect(box.height).toBeLessThan(height / 2);
      } else if (placement === "top") {
        expect(Math.abs(box.y)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.width - width)).toBeLessThanOrEqual(PX);
        expect(box.height).toBeLessThan(height / 2);
      } else if (placement === "left") {
        expect(Math.abs(box.x)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.height - height)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.width - 384)).toBeLessThanOrEqual(PX);
      } else {
        expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.height - height)).toBeLessThanOrEqual(PX);
        expect(Math.abs(box.width - 384)).toBeLessThanOrEqual(PX);
      }

      /* The styles arrived, not only the class name: the panel has its overlay fill. */
      expect(
        await dialog.evaluate((element) => getComputedStyle(element).backgroundColor),
      ).not.toBe("rgba(0, 0, 0, 0)");

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  test("isDetached leaves a gap to the edge", async ({page}) => {
    await goto(page, "components-sheet--detached");

    const dialog = await open(page, "Open detached");
    const box = await settled(dialog);
    const {height, width} = viewport(page);

    /* m-2: 8px from the bottom and from both sides. */
    expect(Math.abs(height - (box.y + box.height) - 8)).toBeLessThanOrEqual(PX);
    expect(Math.abs(box.x - 8)).toBeLessThanOrEqual(PX);
    expect(Math.abs(width - (box.x + box.width) - 8)).toBeLessThanOrEqual(PX);
  });

  test("emulated reduced motion opens at its snap point with no intermediate box heights", async ({
    page,
  }) => {
    await page.emulateMedia({reducedMotion: "reduce"});
    await goto(page, "components-sheet--snap-points");

    /* Record how much of the dialog shows on every frame from the press until it has settled. */
    await page.evaluate(() => {
      const samples: number[] = [];

      (window as unknown as {sheetSamples: number[]}).sheetSamples = samples;

      const sample = () => {
        const dialog = document.querySelector('[data-slot="sheet-dialog"]');

        if (dialog) samples.push(window.innerHeight - dialog.getBoundingClientRect().top);
        requestAnimationFrame(sample);
      };

      requestAnimationFrame(sample);
    });

    const dialog = await open(page, "Open with snap points");
    const box = await settled(dialog);
    const target = box.height * 0.25;

    expect(Math.abs(revealed(page, box) - target)).toBeLessThanOrEqual(PX);

    const samples = await page.evaluate(
      () => (window as unknown as {sheetSamples: number[]}).sheetSamples,
    );
    /* Off screen (nothing revealed yet) is not an intermediate height; anything else must be the snap. */
    const intermediate = samples.filter((value) => value > PX && Math.abs(value - target) > PX);

    expect(samples.length).toBeGreaterThan(0);
    expect(intermediate).toEqual([]);
    /* The enter resolved: focus is inside and the page behind is inert. */
    expect(await focusInside(dialog)).toBe(true);
    expect(
      await page
        .locator("#storybook-root")
        .evaluate(
          (root) =>
            !!root.closest("[inert], [aria-hidden='true']") || !!root.querySelector("[inert]"),
        ),
    ).toBe(true);
  });

  /** A right sheet's revealed width: from its left edge to the viewport's right edge. */
  const revealedX = (page: Page, box: {x: number}) => viewport(page).width - box.x;

  /*
   * The handle of a horizontal snap sheet in a given reading direction: `more` is the arrow that
   * reveals more of it. A drag is physical either way: toward the left reveals a right sheet.
   */
  const horizontalHandle = async (page: Page, more: "ArrowLeft" | "ArrowRight") => {
    const less = more === "ArrowRight" ? "ArrowLeft" : "ArrowRight";
    const dialog = await open(page, "Open side sheet");
    const slider = page.getByRole("slider", {name: "Resize sheet"});
    const start = await settled(dialog);

    /* Half of the sheet shows; the rest is still past the right edge. */
    expect(Math.abs(revealedX(page, start) - start.width * 0.5)).toBeLessThanOrEqual(PX);
    await expect(slider).toHaveAttribute("aria-orientation", "horizontal");
    await expect(slider).toHaveAttribute("aria-valuemin", "50");

    await focusHandle(page);
    await settled(dialog);

    const step = async (key: string, value: number) => {
      await page.keyboard.press(key);
      await expect(slider).toHaveAttribute("aria-valuenow", String(value));

      const box = await settled(dialog);

      expect(Math.abs(revealedX(page, box) - (box.width * value) / 100)).toBeLessThanOrEqual(PX);
    };

    await step("Home", 50);
    await step(more, 100);
    await step(less, 50);

    /* From half, a slow pull a third of the width to the left rests at full width. */
    await dragHandle(page, 0, -start.width / 3);
    await expect(slider).toHaveAttribute("aria-valuenow", "100");

    /* Fully revealed, the sheet is one pixel short of the viewport and on its right edge. */
    const full = await settled(dialog);

    expect(Math.abs(full.x + full.width - viewport(page).width)).toBeLessThanOrEqual(PX);
    expect(full.x).toBeLessThanOrEqual(PX);

    /* Escape from full width closes, and the overlay is gone, not left mounted off screen. */
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  };

  test("horizontal snap sheet: arrows, drag and Escape from full width", async ({page}) => {
    await goto(page, "components-sheet--horizontal-snap");
    await horizontalHandle(page, "ArrowRight");
  });

  test("top snap sheet: Escape from full height unmounts it", async ({page}) => {
    await goto(page, "components-sheet--top-snap");

    const dialog = await open(page, "Open top sheet");
    const box = await settled(dialog);

    /* A quarter shows, from the viewport's top edge down. */
    expect(Math.abs(box.y + box.height - box.height * 0.25)).toBeLessThanOrEqual(PX);

    /* Focus straight onto the handle: Tab would first reach the close trigger and expand the sheet. */
    await handle(page).evaluate((element: HTMLElement) => element.focus({preventScroll: true}));
    await page.keyboard.press("End");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
    expect(Math.abs((await settled(dialog)).y)).toBeLessThanOrEqual(PX);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  });

  test.describe("RTL", () => {
    /* A right-to-left locale gives React Aria its direction; the document follows it. */
    test.use({locale: "he-IL"});

    test("a horizontal handle follows the reading direction: ArrowLeft reveals more", async ({
      page,
    }) => {
      await goto(page, "components-sheet--horizontal-snap");
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });
      await horizontalHandle(page, "ArrowLeft");
    });

    test('with dir="rtl" a right sheet stays on the right edge', async ({page}) => {
      await goto(page, "components-sheet--placements");
      /* The preview writes its own root attributes while it boots, so the direction goes on after. */
      await page.evaluate(() => {
        document.documentElement.dir = "rtl";
      });

      const {width} = viewport(page);

      expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe("rtl");

      const right = await open(page, "Open right");
      const box = await settled(right);

      expect(Math.abs(box.x + box.width - width)).toBeLessThanOrEqual(PX);

      /*
       * The primitive pins its scroller to left-to-right, so scroll positions stay positive in RTL:
       * the handle's drag and keyboard maths assume it.
       */
      const geometry = await scroller(page).evaluate((element) => ({
        direction: getComputedStyle(element).direction,
        scrollLeft: element.scrollLeft,
      }));

      expect(geometry.direction).toBe("ltr");
      expect(geometry.scrollLeft).toBeGreaterThan(0);

      await page.keyboard.press("Escape");
      await expect(right).toBeHidden();

      const left = await open(page, "Open left");
      const leftBox = await settled(left);

      expect(Math.abs(leftBox.x)).toBeLessThanOrEqual(PX);
      expect(await scroller(page).evaluate((element) => element.scrollLeft)).toBeGreaterThanOrEqual(
        0,
      );
    });
  });

  test("forced colors: the dialog border is a system colour and the focused handle has an outline", async ({
    page,
  }) => {
    await page.emulateMedia({forcedColors: "active"});
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");

    await settled(dialog);

    const border = await dialog.evaluate((element) => {
      const style = getComputedStyle(element);
      /* A probe drawn with the system colour the panel's border must use. */
      const probe = document.createElement("div");

      probe.style.border = "1px solid CanvasText";
      document.body.append(probe);

      const expected = getComputedStyle(probe).borderTopColor;

      probe.remove();

      return {color: style.borderTopColor, expected, width: style.borderTopWidth};
    });

    expect(border.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(border.color).toBe(border.expected);
    expect(parseFloat(border.width)).toBeGreaterThan(0);

    await focusHandle(page);

    const outline = await handle(page).evaluate((element) => {
      const style = getComputedStyle(element);

      return {style: style.outlineStyle, width: style.outlineWidth};
    });

    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThan(0);
  });

  test("keyboard: arrows, Home and End on the focused handle move the sheet; Alt+Arrow does not; Escape closes", async ({
    page,
  }) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const slider = page.getByRole("slider", {name: "Resize sheet"});

    await settled(dialog);
    await focusHandle(page);
    /* Let the scroll that the focus itself starts finish before the first key. */
    await settled(dialog);
    await expect(slider).toHaveAttribute("aria-valuemin", "25");
    await expect(slider).toHaveAttribute("aria-valuemax", "100");

    const step = async (key: string, value: number) => {
      await page.keyboard.press(key);
      await expect(slider).toHaveAttribute("aria-valuenow", String(value));

      const box = await settled(dialog);

      expect(Math.abs(revealed(page, box) - (box.height * value) / 100)).toBeLessThanOrEqual(PX);
    };

    await step("Home", 25);
    await step("ArrowUp", 50);
    await step("ArrowUp", 100);

    /*
     * A chord is not the slider's: it neither steps nor claims the key. Checked at full height,
     * where an ArrowDown the slider wrongly took would step to half, and where the browser's own
     * scroll for the key has nowhere to go.
     */
    await page.evaluate(() => {
      window.addEventListener("keydown", (event) => {
        if (event.altKey)
          (window as unknown as {altPrevented: boolean}).altPrevented = event.defaultPrevented;
      });
    });
    await page.keyboard.press("Alt+ArrowDown");
    await settled(dialog);
    await expect(slider).toHaveAttribute("aria-valuenow", "100");
    expect(
      await page.evaluate(() => (window as unknown as {altPrevented?: boolean}).altPrevented),
    ).toBe(false);

    await step("ArrowDown", 50);
    await step("Home", 25);
    await step("End", 100);

    /* Escape closes from full height, and the overlay is gone, not left mounted off screen. */
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);
  });

  /*
   * Moving focus within an open sheet must not move it. While a sheet is open the primitive's
   * scroll lock replaces focus() with one that scrolls the focused element's scroll parent to centre
   * it; its "already in view" check compares against the element's own height instead of the
   * scroller's, so it fires for almost any element, and the snap scroller then rests at another
   * point (25% -> 50%, 100% -> 50%; a full top sheet scrolls to its closed end). The sheet cancels
   * that scroll when the newly focused element is already in view.
   */
  test("Tab reaches the handle of an open snap sheet", async ({page}) => {
    await goto(page, "components-sheet--snap-points");
    await open(page, "Open with snap points");
    await page.keyboard.press("Tab");
    await expect(handle(page)).toBeFocused();
  });

  test("Tab onto the handle leaves the sheet at the snap point it rests on", async ({page}) => {
    /* Room for a cold preview compile (up to 60 s) plus the case itself, not the 150 s default. */
    test.setTimeout(90_000);
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const before = await settled(dialog);

    await page.keyboard.press("Tab");
    await expect(handle(page)).toBeFocused();

    const after = await settled(dialog);

    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(PX);
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "25");

    /* From full height too: the handle is in view there, so Tab back onto it keeps it at 100%. */
    await page.keyboard.press("End");
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");

    const full = await settled(dialog);

    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(handle(page)).toBeFocused();
    expect(Math.abs((await settled(dialog)).y - full.y)).toBeLessThanOrEqual(PX);
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  test.describe("on a touch screen", () => {
    /*
     * With touch points the primitive defers its focus scroll by two frames (it waits to see
     * whether a software keyboard opens), so the cancel has to follow it there.
     */
    test.use({hasTouch: true});

    test("Tab onto the handle leaves the sheet at the snap point it rests on", async ({
      browserName,
      page,
    }) => {
      /* Playwright's WebKit reports no touch points with hasTouch, so the deferred path never runs. */
      test.skip(browserName === "webkit", "WebKit: hasTouch leaves navigator.maxTouchPoints at 0");
      test.setTimeout(90_000);
      await goto(page, "components-sheet--snap-points");
      expect(await page.evaluate(() => navigator.maxTouchPoints)).toBeGreaterThan(0);

      const dialog = await open(page, "Open with snap points");
      const before = await settled(dialog);

      await page.keyboard.press("Tab");
      await expect(handle(page)).toBeFocused();
      expect(Math.abs((await settled(dialog)).y - before.y)).toBeLessThanOrEqual(PX);
    });
  });

  /*
   * The top-sheet variant: the first Tab, onto the close trigger above the viewport, rightly
   * expands the sheet to bring it into view; the second, onto the handle at the bottom of the full
   * sheet, used to scroll it to its closed end and dismiss it.
   */
  test("two Tabs inside a top snap sheet leave it open", async ({page}) => {
    /* Room for a cold preview compile (up to 60 s) plus the case itself, not the 150 s default. */
    test.setTimeout(90_000);
    await goto(page, "components-sheet--top-snap");

    const dialog = await open(page, "Open top sheet");

    await settled(dialog);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", {name: "Close"})).toBeFocused();

    const full = await settled(dialog);

    /* The close trigger was off screen: bringing it into view expanded the sheet. */
    expect(Math.abs(full.y)).toBeLessThanOrEqual(PX);

    await page.keyboard.press("Tab");
    await expect(handle(page)).toBeFocused();
    /* A negative: give a scroll and an exit the time they would take, then look once. */
    await page.waitForTimeout(1500);
    expect(await page.locator('[data-slot="sheet-overlay"]:not([data-exiting])').count()).toBe(1);
    expect(Math.abs((await settled(dialog)).y - full.y)).toBeLessThanOrEqual(PX);
  });

  /*
   * The browser's own keyboard scrolling must not move the sheet: with focus on something that
   * cannot scroll, the key would scroll the snap scroller, toward the closed end (PageUp, Home,
   * ArrowUp, Shift+Space dismiss a bottom sheet) or toward full size (PageDown, End, ArrowDown,
   * Space). The handle is the keyboard way to resize, and Escape the way to close.
   */
  const SCROLL_KEYS = [
    "PageUp",
    "Home",
    "ArrowUp",
    "Shift+Space",
    "PageDown",
    "End",
    "ArrowDown",
    "Space",
  ] as const;

  /** The overlay's state after a key, once a scroll and an exit have had the time they would take. */
  const afterKey = async (page: Page, key: string) => {
    await page.keyboard.press(key);
    /* A negative: give a scroll and an exit the time they would take, then look once. */
    await page.waitForTimeout(1500);

    return page.evaluate(() => {
      const overlay = document.querySelector('[data-slot="sheet-overlay"]');

      return {exiting: !!overlay?.hasAttribute("data-exiting"), mounted: !!overlay};
    });
  };

  for (const key of SCROLL_KEYS) {
    test(`${key} on a focused control in the sheet body leaves the sheet where it rests`, async ({
      page,
    }) => {
      test.setTimeout(60_000);
      await goto(page, "components-sheet--snap-points");

      const dialog = await open(page, "Open with snap points");
      const before = await settled(dialog);
      const control = page.getByRole("button", {name: "Show all options"});

      /* Focus without any focus scroll, so the sheet still rests at its first snap point. */
      await control.evaluate((element: HTMLElement) => element.focus({preventScroll: true}));
      await expect(control).toBeFocused();

      expect(await afterKey(page, key)).toEqual({exiting: false, mounted: true});
      expect(Math.abs((await settled(dialog)).y - before.y)).toBeLessThanOrEqual(PX);
    });
  }

  test("scroll keys on the focused dialog and the handle leave the sheet where it rests", async ({
    page,
  }) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const before = await settled(dialog);

    /* The open sheet focuses its dialog. */
    await expect(dialog).toBeFocused();
    expect(await afterKey(page, "PageUp")).toEqual({exiting: false, mounted: true});
    expect(await afterKey(page, "Space")).toEqual({exiting: false, mounted: true});
    expect(Math.abs((await settled(dialog)).y - before.y)).toBeLessThanOrEqual(PX);

    /* The slider takes arrows, Home and End; the page keys are not its own. */
    await focusHandle(page);
    expect(await afterKey(page, "PageUp")).toEqual({exiting: false, mounted: true});
    expect(await afterKey(page, "PageDown")).toEqual({exiting: false, mounted: true});
    expect(Math.abs((await settled(dialog)).y - before.y)).toBeLessThanOrEqual(PX);
  });

  test("ArrowLeft and ArrowRight on the dialog of a right sheet leave it where it rests", async ({
    page,
  }) => {
    await goto(page, "components-sheet--horizontal-snap");

    const dialog = await open(page, "Open side sheet");
    const before = await settled(dialog);

    await expect(dialog).toBeFocused();
    expect(await afterKey(page, "ArrowLeft")).toEqual({exiting: false, mounted: true});
    expect(await afterKey(page, "ArrowRight")).toEqual({exiting: false, mounted: true});
    expect(Math.abs((await settled(dialog)).x - before.x)).toBeLessThanOrEqual(PX);
  });

  test("scroll keys still scroll a scrollable body, and stop at its end without moving the sheet", async ({
    page,
  }) => {
    await goto(page, "components-sheet--scrolling-body");

    const dialog = await open(page, "Open long sheet");
    const before = await settled(dialog);
    const body = page.locator('[data-slot="sheet-body"]');
    const bodyScroll = () => body.evaluate((element) => element.scrollTop);

    await body.focus();
    expect(await bodyScroll()).toBe(0);

    await page.keyboard.press("PageDown");
    await expect.poll(bodyScroll).toBeGreaterThan(0);
    await page.keyboard.press("End");
    await expect
      .poll(() => body.evaluate((e) => e.scrollHeight - e.clientHeight - e.scrollTop))
      .toBeLessThanOrEqual(1);
    /* At the body's end, a further key has nothing inside to scroll and must not move the sheet. */
    expect(await afterKey(page, "PageDown")).toEqual({exiting: false, mounted: true});

    await page.keyboard.press("Home");
    await expect.poll(bodyScroll).toBe(0);
    /* At its start the same goes the other way, where it would dismiss. */
    expect(await afterKey(page, "ArrowUp")).toEqual({exiting: false, mounted: true});
    expect(Math.abs((await settled(dialog)).y - before.y)).toBeLessThanOrEqual(PX);
  });

  test("isDismissable=false: Escape, a backdrop click and a wheel scroll never close it", async ({
    page,
  }) => {
    /* Positive control: the same three gestures each close a dismissable sheet. */
    await goto(page, "components-sheet--default");

    let dialog = await open(page, "Open sheet");

    await settled(dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    dialog = await open(page, "Open sheet");
    await settled(dialog);
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();

    dialog = await open(page, "Open sheet");

    const box = await settled(dialog);

    /* A wheel over the header scrolls the snap scroller toward its closed end. */
    await page.mouse.move(box.x + 40, box.y + 40);
    await page.mouse.wheel(0, -box.height * 2);
    await expect(dialog).toBeHidden();

    await goto(page, "components-sheet--non-dismissable");

    const pinned = await open(page, "Open required sheet");
    const rest = await settled(pinned);

    await page.keyboard.press("Escape");
    await page.mouse.click(10, 10);
    await page.mouse.move(rest.x + 40, rest.y + 40);
    await page.mouse.wheel(0, -rest.height * 2);

    const after = await settled(pinned);

    await expect(pinned).toBeVisible();
    expect(Math.abs(after.y - rest.y)).toBeLessThanOrEqual(PX);
  });

  test("the slider handle and the close button are at least 24 by 24", async ({page}) => {
    const measure = async (target: Locator) => {
      const box = (await target.boundingBox())!;

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    };

    /* The interactive handle: a slider, on a sheet with snap points. */
    await goto(page, "components-sheet--snap-points");
    await settled(await open(page, "Open with snap points"));
    await measure(page.getByRole("slider", {name: "Resize sheet"}));

    await goto(page, "components-sheet--default");
    await settled(await open(page, "Open sheet"));
    await measure(page.getByRole("button", {name: "Close"}));
  });

  test("the exit marks the backdrop, the content and the dialog with data-exiting", async ({
    page,
  }) => {
    await goto(page, "components-sheet--default");

    const dialog = await open(page, "Open sheet");

    await settled(dialog);

    /* Watch the attribute while the exit runs; it is gone with the overlay once it ends. */
    await page.evaluate(() => {
      const seen = new Set<string>();

      (window as unknown as {exitingSlots: Set<string>}).exitingSlots = seen;
      new MutationObserver((records) => {
        for (const record of records) {
          const element = record.target as Element;

          if (element.hasAttribute("data-exiting"))
            seen.add(element.getAttribute("data-slot") ?? "");
        }
      }).observe(document.body, {
        attributeFilter: ["data-exiting"],
        attributes: true,
        subtree: true,
      });
    });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();

    const slots = await page.evaluate(() => [
      ...(window as unknown as {exitingSlots: Set<string>}).exitingSlots,
    ]);

    expect(slots).toEqual(
      expect.arrayContaining(["sheet-backdrop", "sheet-content", "sheet-dialog"]),
    );
  });

  test("controlled: reopening mid-exit ends open, with focus inside and nothing left inert", async ({
    browserName,
    page,
  }) => {
    /*
     * Known primitive behaviour, not ours to fix: WebKit's smooth exit scroll often moves further
     * in its first frame than the panel is tall (720 -> 434..483 for a 215px panel), so the first
     * frame marked exiting can already have the panel entirely off screen. The primitive's
     * IntersectionObserver has then queued its "panel gone" notice for that frame, and it calls
     * the overlay state's close() when it arrives, just after the reopen. Measured over 32 WebKit
     * runs: every reopen with any of the panel still on screen ended open (26 of 26), and every one
     * with the panel already off it ended closed (6 of 6, with and without the lifecycle's
     * scroll-end signal and the scroll guard). Chromium's first exiting frame has not scrolled yet,
     * so it passes every run. Intermittent, so it cannot be pinned with test.fail.
     */
    test.fixme(browserName === "webkit", "WebKit: a reopen mid-exit can end closed (see above)");
    await goto(page, "components-sheet--controlled");

    const dialog = await open(page, "Open controlled sheet");

    await settled(dialog);
    /*
     * Close, then reopen while the exit scroll is still under way, and prove it was: the dialog
     * carries data-exiting at the moment of the reopen. Both presses go in from the page, because
     * WebKit's exit is over in about a tenth of a second, less than a round trip from the test, and
     * because the outside is inert while the sheet is open, so the mouse cannot reach it.
     */
    const wasExiting = await page.evaluate(
      () =>
        new Promise<boolean>((resolve) => {
          const press = (name: string) =>
            [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)!;
          let frames = 0;
          /* The reopen goes in on the first frame the dialog is marked as exiting. */
          const tick = () => {
            const exiting = !!document.querySelector('[data-slot="sheet-dialog"][data-exiting]');

            if (exiting || frames++ > 60) {
              press("Open controlled sheet").click();
              resolve(exiting);
            } else requestAnimationFrame(tick);
          };

          press("Close from state").click();
          requestAnimationFrame(tick);
        }),
    );

    expect(wasExiting).toBe(true);

    await expect(dialog).toBeVisible();

    const box = await settled(dialog);

    expect(Math.abs(box.y + box.height - viewport(page).height)).toBeLessThanOrEqual(PX);
    await expect.poll(() => focusInside(dialog)).toBe(true);
    await expect(page.getByText("isOpen: true").first()).toBeAttached();

    /* Closing for real afterwards leaves the page usable: nothing is stuck inert. */
    await page.getByRole("button", {name: "Close from state"}).click();
    await expect(dialog).toBeHidden();
    expect(await page.evaluate(() => document.querySelectorAll("[inert]").length)).toBe(0);
    await page.getByRole("button", {name: "Open controlled sheet"}).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("a focused control in a partial snap sheet keeps its scroll-padding clearance", async ({
    page,
  }) => {
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");

    await settled(dialog);

    const padding = await page.locator('[data-slot="sheet-body"]').evaluate((element) => {
      const style = getComputedStyle(element);

      return [style.scrollPaddingTop, style.scrollPaddingBottom];
    });

    /* 1rem plus the primitive's keyboard and chrome inset, which is zero on a desktop viewport. */
    expect(padding).toEqual(["16px", "16px"]);

    /*
     * Exercised: Tab to a control that the first snap point leaves below the viewport. The Tabs
     * before it (onto the handle, in view) leave the sheet where it rests; this one is out of view,
     * so its focus scroll is kept, and it moves the outer snap scroller, which is what brings the
     * control into view. The body does not scroll at a partial snap point (overflow hidden until
     * expanded), so this proves the control ends unobscured, not that the body's scroll-padding put
     * it there.
     */
    const control = page.getByRole("button", {name: "Show all options"});
    const {height} = viewport(page);

    expect((await control.boundingBox())!.y).toBeGreaterThan(height);

    const isFocused = () => control.evaluate((element) => element === document.activeElement);

    for (let i = 0; i < 4 && !(await isFocused()); i++) await page.keyboard.press("Tab");
    await expect(control).toBeFocused();
    await settled(dialog);

    const box = await settled(control);

    /* Not obscured by the sheet's visible edge: in view, with the 16px clearance. */
    expect(box.y).toBeGreaterThanOrEqual(16);
    expect(box.y + box.height).toBeLessThanOrEqual(height - 16);
  });

  for (const theme of THEMES) {
    for (const story of [
      {id: "components-sheet--default", trigger: "Open sheet"},
      {id: "components-sheet--snap-points", trigger: "Open with snap points"},
    ] as const) {
      test(`${story.id} with the sheet open meets WCAG 2.2 AA in ${theme}`, async ({page}) => {
        await goto(page, story.id, theme);

        const dialog = await open(page, story.trigger);

        await settled(dialog);
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
  }
});

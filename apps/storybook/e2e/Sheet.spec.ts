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
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

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

  test("nested sheet scales the parent back and restores it on close", async ({page}) => {
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

    const child = await open(page, "Open nested sheet", "Nested sheet");

    await settled(child);
    await settled(content);

    /* translateZ(-120px) under perspective(1000px): drawn at 1000 / 1120 of its size. */
    expect(await drawnScale()).toBeCloseTo(1000 / 1120, 2);

    await page.keyboard.press("Escape");
    await expect(child).toBeHidden();
    await expect(parent).toBeVisible();

    const restored = await settled(parent);

    expect(await drawnScale()).toBeCloseTo(1, 3);
    expect(Math.abs(restored.width - before.width)).toBeLessThanOrEqual(PX);
    expect(Math.abs(restored.x - before.x)).toBeLessThanOrEqual(PX);
    expect(Math.abs(restored.y - before.y)).toBeLessThanOrEqual(PX);
    /* Escape closed only the topmost sheet, and focus is back in the parent. */
    await expect.poll(() => focusInside(parent)).toBe(true);
  });

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

  test.describe("RTL", () => {
    /* A right-to-left locale gives React Aria its direction; the document follows it. */
    test.use({locale: "he-IL"});

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

      return {color: style.borderTopColor, width: style.borderTopWidth};
    });

    expect(border.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(border.color).not.toBe("transparent");
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

    /* Home first: moving focus onto the handle can move the sheet (see the expected failure below). */
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
   * Known defect, not fixed here: moving focus onto the handle with Tab runs the browser's
   * focus scroll on the snap scroller, which centres the handle in the viewport and leaves the
   * sheet at the next snap point (25% -> 50% in both engines, and 100% -> 50% from full height),
   * although the handle was already in view. A plain scrollIntoView({block: "nearest"}) does not
   * move it, and focus({preventScroll: true}) does not either; React Aria's focus containment
   * moves focus with a scrolling focus(). Marked as an expected failure so the fix shows up here.
   */
  test("Tab onto the handle leaves the sheet at the snap point it rests on", async ({page}) => {
    test.fail(true, "focus scroll moves the snap scroller: see the comment above");
    await goto(page, "components-sheet--snap-points");

    const dialog = await open(page, "Open with snap points");
    const before = await settled(dialog);

    await focusHandle(page);

    const after = await settled(dialog);

    expect(Math.abs(after.y - before.y)).toBeLessThanOrEqual(PX);
    await expect(page.getByRole("slider")).toHaveAttribute("aria-valuenow", "25");
  });

  test("isDismissable=false: Escape, a backdrop click and a swipe never close it", async ({
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

  test("the handle and the close button are at least 24 by 24", async ({page}) => {
    await goto(page, "components-sheet--default");

    const dialog = await open(page, "Open sheet");

    await settled(dialog);

    for (const target of [handle(page), page.locator('[data-slot="sheet-close-trigger"]')]) {
      const box = (await target.boundingBox())!;

      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
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
    page,
  }) => {
    await goto(page, "components-sheet--controlled");

    const dialog = await open(page, "Open controlled sheet");

    await settled(dialog);
    await page.getByRole("button", {name: "Close from state"}).click();
    /* Reopen while the exit scroll is still under way (the outside is inert, so not by the mouse). */
    await page
      .locator("button", {hasText: "Open controlled sheet"})
      .evaluate((element: HTMLElement) => element.click());

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

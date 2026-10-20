import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier of Drawer. What lives here is what jsdom fakes: the real geometry of an edge-docked
 * panel, focus containment inside the portal, pointer-driven drag-to-dismiss, and the backdrop
 * hit-testing that decides which clicks dismiss.
 *
 * The audit navigates to the iframe URL directly rather than through the manager: injectAxe only
 * reaches the main frame, so a frame selector would audit the iframe element and not the story
 * inside it (see ../AGENTS.md). It runs against the OPEN drawer, since a closed one is one button.
 */

const PLACEMENT_STORY = "components-drawer--placements";
const THEMES = ["default-light", "default-dark"] as const;

const AUDITED_STORIES = [
  {id: "components-drawer--default", trigger: "Open drawer"},
  {id: "components-drawer--scrolling-body", trigger: "Open long drawer"},
  {id: "components-drawer--controlled", trigger: "Open controlled drawer"},
] as const;

const open = async (page: Page, trigger: Locator) => {
  /* Wait for the story before clicking: a click before React mounts lands in an empty iframe. */
  await expect(trigger).toBeVisible({timeout: 60_000});
  await trigger.click();

  const dialog = page.getByRole("dialog");

  await expect(dialog).toBeVisible();

  return dialog;
};

/* The panel slides in; geometry is only meaningful once its box stops moving. */
const settled = async (dialog: Locator) => {
  let previous = "";

  await expect
    .poll(async () => {
      const box = await dialog.boundingBox();
      const current = JSON.stringify(box);
      const stable = current === previous;

      previous = current;

      return stable;
    })
    .toBe(true);

  return (await dialog.boundingBox())!;
};

const goto = (page: Page, id: string, theme: string = "default-light") =>
  page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);

test.describe("Drawer: overlay in a real browser", () => {
  /* Same headroom for a cold preview compile: the test timeout must not cut the wait above. */
  test.setTimeout(150_000);

  test("each placement docks the panel to its own edge", async ({page}) => {
    await goto(page, PLACEMENT_STORY);

    const viewport = page.viewportSize()!;

    for (const placement of ["bottom", "top", "left", "right"] as const) {
      const dialog = await open(page, page.getByRole("button", {name: `Open ${placement}`}));
      const box = await settled(dialog);

      if (placement === "bottom") {
        expect(Math.abs(box.y + box.height - viewport.height)).toBeLessThanOrEqual(1);
        expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
      } else if (placement === "top") {
        expect(Math.abs(box.y)).toBeLessThanOrEqual(1);
        expect(box.width).toBeGreaterThanOrEqual(viewport.width - 1);
      } else if (placement === "left") {
        expect(Math.abs(box.x)).toBeLessThanOrEqual(1);
        expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
      } else {
        expect(Math.abs(box.x + box.width - viewport.width)).toBeLessThanOrEqual(1);
        expect(box.height).toBeGreaterThanOrEqual(viewport.height - 1);
      }

      /* The styles arrived, not only the class name: the panel takes its fill from the overlay token. */
      const background = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);

      expect(background).not.toBe("rgba(0, 0, 0, 0)");

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    }
  });

  test("the backdrop covers the viewport", async ({page}) => {
    await goto(page, "components-drawer--default");
    await open(page, page.getByRole("button", {name: "Open drawer"}));

    const viewport = page.viewportSize()!;
    const box = await page.locator('[data-slot="drawer-backdrop"]').boundingBox();

    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(box!.height).toBeGreaterThanOrEqual(viewport.height - 1);
  });

  /* Containment is half of the modal contract and the half jsdom cannot judge. */
  test("Tab never leaves the dialog", async ({page}) => {
    await goto(page, "components-drawer--default");

    const dialog = await open(page, page.getByRole("button", {name: "Open drawer"}));

    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test("Escape closes the drawer and returns focus to the trigger", async ({page}) => {
    await goto(page, "components-drawer--default");

    const trigger = page.getByRole("button", {name: "Open drawer"});
    const dialog = await open(page, trigger);

    await page.keyboard.press("Escape");

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("a click on the backdrop dismisses, unless isDismissable is false", async ({page}) => {
    await goto(page, "components-drawer--default");

    const dialog = await open(page, page.getByRole("button", {name: "Open drawer"}));

    /* (10, 10) is backdrop, well clear of a bottom-docked panel. */
    await page.mouse.click(10, 10);
    await expect(dialog).toBeHidden();

    await goto(page, "components-drawer--dismiss-behavior");

    const pinned = await open(page, page.getByRole("button", {name: "Not dismissable"}));

    await settled(pinned);
    await page.mouse.click(10, 10);

    await expect(pinned).toBeVisible();
  });

  /*
   * Drag-to-dismiss uses pointer capture and measured offsets, so only a browser can run it. A
   * short pull springs back; a long one past 30% of the panel closes it.
   */
  test("dragging the handle down past the threshold closes the drawer", async ({page}) => {
    await goto(page, "components-drawer--default");

    const dialog = await open(page, page.getByRole("button", {name: "Open drawer"}));
    const before = await settled(dialog);
    const handle = (await page.locator('[data-slot="drawer-handle"]').boundingBox())!;
    const x = handle.x + handle.width / 2;
    const y = handle.y + handle.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + 30, {steps: 6});
    await page.mouse.up();

    /* A 30px pull is under 30% of the panel and slow enough not to count as a flick. */
    await expect(dialog).toBeVisible();
    await expect
      .poll(async () => Math.abs((await dialog.boundingBox())!.y - before.y))
      .toBeLessThanOrEqual(1);

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + before.height, {steps: 12});
    await page.mouse.up();

    await expect(dialog).toBeHidden();
  });

  test("a drag that starts in the body does not close the drawer", async ({page}) => {
    await goto(page, "components-drawer--scrolling-body");

    const dialog = await open(page, page.getByRole("button", {name: "Open long drawer"}));

    await settled(dialog);

    const body = (await page.locator('[data-slot="drawer-body"]').boundingBox())!;
    const x = body.x + body.width / 2;
    const y = body.y + body.height / 2;

    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 300, y, {steps: 12});
    await page.mouse.up();

    await expect(dialog).toBeVisible();
  });

  for (const theme of THEMES) {
    for (const story of AUDITED_STORIES) {
      test(`${story.id} with the drawer open meets WCAG 2.2 AA in ${theme}`, async ({page}) => {
        await goto(page, story.id, theme);

        const dialog = await open(page, page.getByRole("button", {name: story.trigger}));

        await settled(dialog);
        expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

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

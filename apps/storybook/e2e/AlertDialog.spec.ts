import type {Locator, Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * AlertDialog in a real browser. This tier holds what jsdom fakes: the geometry of the modal
 * overlay, real focus containment, and the portal into body.
 *
 * Audits open the story iframe directly (page.goto on /iframe.html), not through the manager:
 * injectAxe only reaches the main frame. See ../AGENTS.md.
 *
 * The audit runs on the OPEN dialog: a closed one is a single button on the page, and the overlay
 * is invisible to axe until it opens.
 */

const STORIES_OPEN_AUDIT = [
  {id: "components-alertdialog--default", trigger: "Delete Project"},
  {id: "components-alertdialog--custom-trigger", trigger: "Remove item"},
] as const;

const THEMES = ["default-light", "default-dark"] as const;

const openDialog = async (page: Page, trigger: Locator) => {
  /* The story must be ready first: before React mounts a click would land on an empty iframe. */
  await expect(trigger).toBeVisible({timeout: 60_000});
  await trigger.click();

  const dialog = page.getByRole("alertdialog");

  await expect(dialog).toBeVisible();

  return dialog;
};

test.describe("AlertDialog: overlay in a real browser", () => {
  /* The first tests of a file pay for the cold preview compile. */
  test.setTimeout(150_000);

  test("the backdrop covers the viewport and the dialog is centered inside it", async ({page}) => {
    await page.goto("/iframe.html?id=components-alertdialog--default&globals=theme:default-light");

    const backdrop = page.locator('[data-slot="alert-dialog-backdrop"]');
    const dialog = await openDialog(page, page.getByRole("button", {name: "Delete Project"}));

    const viewport = page.viewportSize()!;
    const [backdropBox, dialogBox] = await Promise.all([
      backdrop.boundingBox(),
      dialog.boundingBox(),
    ]);

    expect(backdropBox).not.toBeNull();
    expect(dialogBox).not.toBeNull();
    expect(backdropBox!.width).toBeGreaterThanOrEqual(viewport.width - 1);
    expect(backdropBox!.height).toBeGreaterThanOrEqual(viewport.height - 1);

    expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.y).toBeGreaterThanOrEqual(0);
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width);
    expect(dialogBox!.y + dialogBox!.height).toBeLessThanOrEqual(viewport.height);
    expect(Math.abs(dialogBox!.x + dialogBox!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(
      1,
    );

    /* The styles arrived, not just the class name: the surface takes the overlay token. */
    const background = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(background).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("Tab never leaves the dialog", async ({page}) => {
    await page.goto("/iframe.html?id=components-alertdialog--default&globals=theme:default-light");

    const dialog = await openDialog(page, page.getByRole("button", {name: "Delete Project"}));

    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);

    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    }
  });

  test("Escape and an outside click do not close it by default", async ({page}) => {
    await page.goto("/iframe.html?id=components-alertdialog--default&globals=theme:default-light");

    const dialog = await openDialog(page, page.getByRole("button", {name: "Delete Project"}));

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    await page.mouse.click(10, 10);
    await expect(dialog).toBeVisible();
  });

  test("a button with slot=close closes it and focus returns to the trigger", async ({page}) => {
    await page.goto("/iframe.html?id=components-alertdialog--default&globals=theme:default-light");

    const trigger = page.getByRole("button", {name: "Delete Project"});
    const dialog = await openDialog(page, trigger);

    await dialog.getByRole("button", {name: "Cancel"}).click();

    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("isDismissable closes it on an outside click", async ({page}) => {
    await page.goto(
      "/iframe.html?id=components-alertdialog--dismiss-behavior&globals=theme:default-light",
    );

    const dialog = await openDialog(
      page,
      page.getByRole("button", {name: "Dismiss on outside click"}),
    );

    await page.mouse.click(10, 10);

    await expect(dialog).toBeHidden();
  });

  for (const theme of THEMES) {
    for (const story of STORIES_OPEN_AUDIT) {
      test(`${story.id} with the dialog open passes WCAG 2.2 AA in ${theme}`, async ({page}) => {
        await page.goto(`/iframe.html?id=${story.id}&globals=theme:${theme}`);

        const dialog = await openDialog(page, page.getByRole("button", {name: story.trigger}));

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

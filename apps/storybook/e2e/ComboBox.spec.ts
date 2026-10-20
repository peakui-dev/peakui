import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";

/*
 * The browser tier of ComboBox. It owns what jsdom cannot give:
 *
 * 1. The dynamic `defaultItems` + function-children composition (the DynamicItems story). Under jsdom
 *    RAC's collection builder does not report it ready, so the unit suite composes static items;
 *    open, filter, select and close over `defaultItems` is proven here, in a real browser.
 * 2. The popover's real geometry: it opens under the field and is as wide as the input group.
 * 3. The keyboard cycle: typing filters, ArrowDown moves the virtual focus, Enter selects and
 *    closes, Escape closes and keeps focus in the input.
 *
 * The spec addresses the story iframe directly (page.goto on /iframe.html), not the manager;
 * see ../AGENTS.md.
 */

const STORY = "components-pickers-combobox--dynamic-items";

const getInput = (page: Page) => page.getByRole("combobox", {name: "Animal"});

const openListbox = async (page: Page) => {
  const listbox = page.getByRole("listbox");

  await page.getByRole("button", {name: /show suggestions/i}).click();

  /* The entry animation fades opacity in from zero; visible is not yet settled. */
  await expect(listbox).toBeVisible();
  await expect(listbox.locator("xpath=ancestor::*[@data-slot='combo-box-popover']")).toHaveCSS(
    "opacity",
    "1",
  );

  return listbox;
};

test.describe("ComboBox (browser)", () => {
  /*
   * Readiness sign before any interaction: a cold server serves an empty iframe before the
   * story renders, and assertions against nothing would pass silently.
   */
  test.beforeEach(async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY}&globals=theme:default-light`);

    await expect(page.getByRole("heading", {level: 2})).toBeVisible();
  });

  test("opens from the trigger over a dynamic collection, selects, and closes", async ({page}) => {
    const input = getInput(page);
    const listbox = await openListbox(page);

    await expect(page.getByRole("option")).toHaveCount(6);

    await page.getByRole("option", {name: "Panda"}).click();

    await expect(input).toHaveValue("Panda");
    await expect(listbox).toBeHidden();
  });

  test("filters the dynamic collection as the user types", async ({page}) => {
    const input = getInput(page);

    await input.click();
    await input.pressSequentially("an");

    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", {name: "Kangaroo"})).toBeVisible();
    await expect(page.getByRole("option", {name: "Panda"})).toBeVisible();

    await input.pressSequentially("x");

    await expect(page.getByText("No results")).toBeVisible();
  });

  test("the popover opens below the field and matches the width of the input group", async ({
    page,
  }) => {
    await openListbox(page);

    const group = page.locator('[data-slot="combo-box-input-group"]');
    const popover = page.locator('[data-slot="combo-box-popover"]');

    const groupBox = await group.boundingBox();
    const popoverBox = await popover.boundingBox();

    expect(groupBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();

    /* Below the field, not over it. */
    expect(popoverBox!.y).toBeGreaterThanOrEqual(groupBox!.y + groupBox!.height - 1);
    /* min-width is the trigger width: never narrower than the group. */
    expect(popoverBox!.width).toBeGreaterThanOrEqual(groupBox!.width - 1);
  });

  test("ArrowDown moves, Enter selects, Escape closes and focus stays in the input", async ({
    page,
  }) => {
    const input = getInput(page);
    const listbox = page.getByRole("listbox");

    await input.focus();
    await page.keyboard.press("ArrowDown");

    await expect(listbox).toBeVisible();

    /* Focus stays on the input; the highlighted option is announced through aria-activedescendant. */
    await expect(input).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(listbox).toBeHidden();
    await expect(input).toHaveValue(/\w+/);
    await expect(input).toBeFocused();

    await page.keyboard.press("ArrowDown");

    await expect(listbox).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(listbox).toBeHidden();
    await expect(input).toBeFocused();
  });

  test("clicking outside closes the popover", async ({page}) => {
    const listbox = await openListbox(page);

    /* The page behind an open popover is hidden from the accessibility tree: click by position. */
    await page.mouse.click(4, 4);

    await expect(listbox).toBeHidden();
  });
});

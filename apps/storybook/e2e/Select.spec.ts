import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";

/*
 * The browser tier of Select. It owns exactly what jsdom cannot give:
 *
 * 1. The dynamic `items` + function-children composition (the DynamicItems story). Under jsdom
 *    RAC's Select refuses to open over a dynamic collection — the unit suite composes static
 *    item children for that reason — so open, select, value and close over `items` is proven
 *    here, in a real browser, on the contract the premium cell family builds on.
 * 2. The keyboard cycle over that same dynamic collection: Enter opens, arrows move focus,
 *    Enter selects and closes, Escape closes and returns focus to the trigger.
 *
 * The spec addresses the story iframe directly (page.goto on /iframe.html), not the manager —
 * same as every other spec here; see ../AGENTS.md.
 */

const STORY = "components-pickers-select--dynamic-items";

const getTrigger = (page: Page) => page.getByRole("button", {name: "State"});

const openListbox = async (page: Page) => {
  const trigger = getTrigger(page);
  const listbox = page.getByRole("listbox");

  await trigger.click();

  /* The entry animation fades opacity in from zero; visible is not yet settled. */
  await expect(listbox).toBeVisible();
  await expect(listbox).toHaveCSS("opacity", "1");

  return listbox;
};

test.describe("Select — dynamic items in a real browser", () => {
  /*
   * Readiness sign before any click: a cold server serves an empty iframe before the story
   * renders, and assertions against nothing would pass silently.
   */
  test("opens over a dynamic items collection, selects, and closes", async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY}&globals=theme:default-light`);

    await expect(page.getByRole("heading", {level: 2})).toBeVisible();

    const trigger = getTrigger(page);
    const listbox = await openListbox(page);

    await page.getByRole("option", {name: "Texas"}).click();

    /* The selected item lands in the trigger value and the popover unmounts. */
    await expect(trigger).toContainText("Texas");
    await expect(listbox).toBeHidden();
  });

  test("Enter opens, arrows move, Enter selects, Escape closes and returns focus", async ({
    page,
  }) => {
    await page.goto(`/iframe.html?id=${STORY}&globals=theme:default-light`);

    await expect(page.getByRole("heading", {level: 2})).toBeVisible();

    const trigger = getTrigger(page);
    const listbox = page.getByRole("listbox");

    /* Enter opens with focus on the first option; one ArrowDown moves to the second. */
    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(listbox).toBeVisible();
    await expect(page.getByRole("option", {name: "California"})).toBeFocused();

    await page.keyboard.press("ArrowDown");

    await expect(page.getByRole("option", {name: "Texas"})).toBeFocused();

    /* Escape closes and hands focus back to the trigger — the dismissal half of the contract. */
    await page.keyboard.press("Escape");

    await expect(listbox).toBeHidden();
    await expect(trigger).toBeFocused();

    /* Enter opens again from the top; ArrowDown then Enter selects and closes. */
    await page.keyboard.press("Enter");

    await expect(listbox).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(listbox).toBeHidden();
    await expect(trigger).toContainText("Texas");
    await expect(trigger).toBeFocused();
  });
});

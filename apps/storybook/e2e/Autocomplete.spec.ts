import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";

/*
 * The browser tier of Autocomplete. It owns what jsdom cannot give:
 *
 * 1. The popover in a real layout: it opens under the trigger, takes the trigger's width, and
 *    the search field receives focus on open.
 * 2. The keyboard cycle across the portal boundary: typing narrows the list while focus stays in
 *    the search field, arrows move the list's virtual focus, Enter selects and closes, and
 *    Escape closes and returns focus to the trigger.
 *
 * The spec addresses the story iframe directly (page.goto on /iframe.html), not the manager.
 */

const STORY = "components-pickers-autocomplete--default";

const getTrigger = (page: Page) => page.getByRole("button", {name: /Favorite Animal/});

const openPopover = async (page: Page) => {
  const listbox = page.getByRole("listbox");

  await getTrigger(page).click();

  /* The entry animation fades opacity in from zero; visible is not yet settled. */
  await expect(listbox).toBeVisible();
  await expect(page.locator('[data-slot="autocomplete-popover"]')).toHaveCSS("opacity", "1");

  return listbox;
};

test.describe("Autocomplete (browser)", () => {
  test.beforeEach(async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY}&globals=theme:default-light`);

    /* Readiness sign: a cold server serves an empty iframe before the story renders. */
    await expect(page.getByRole("heading", {level: 2})).toBeVisible();
  });

  test("opens under the trigger at the trigger's width and focuses the search field", async ({
    page,
  }) => {
    await openPopover(page);

    await expect(page.getByRole("searchbox", {name: "Search animals"})).toBeFocused();

    const trigger = await getTrigger(page).boundingBox();
    const popover = await page.locator('[data-slot="autocomplete-popover"]').boundingBox();

    expect(trigger).not.toBeNull();
    expect(popover).not.toBeNull();
    expect(popover!.y).toBeGreaterThanOrEqual(trigger!.y + trigger!.height);
    expect(Math.abs(popover!.width - trigger!.width)).toBeLessThan(1);
  });

  test("typing narrows the options and a click selects one", async ({page}) => {
    const listbox = await openPopover(page);

    await page.keyboard.type("li");

    await expect(page.getByRole("option")).toHaveText(["Lion"]);

    await page.getByRole("option", {name: "Lion"}).click();

    await expect(getTrigger(page)).toContainText("Lion");
    await expect(listbox).toBeHidden();
  });

  test("shows the empty state when nothing matches", async ({page}) => {
    await openPopover(page);

    await page.keyboard.type("zzz");

    await expect(page.getByText("No results found")).toBeVisible();
  });

  test("arrows move through the list, Enter selects, Escape closes and returns focus", async ({
    page,
  }) => {
    const listbox = page.getByRole("listbox");
    const search = page.getByRole("searchbox", {name: "Search animals"});

    await getTrigger(page).focus();
    await page.keyboard.press("Enter");

    await expect(listbox).toBeVisible();
    await expect(search).toBeFocused();

    /* Escape closes and hands focus back to the trigger. */
    await page.keyboard.press("Escape");

    await expect(listbox).toBeHidden();
    await expect(getTrigger(page)).toBeFocused();

    /* Reopen, type, move the virtual focus and select with the keyboard alone. */
    await page.keyboard.press("Enter");
    await expect(search).toBeFocused();
    await page.keyboard.type("t");
    await expect(page.getByRole("option")).toHaveText(["Cat", "Elephant", "Tiger"]);

    /* Typing moves the virtual focus to the first match; one arrow lands on the second. */
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(listbox).toBeHidden();
    await expect(getTrigger(page)).toContainText("Elephant");
    await expect(getTrigger(page)).toBeFocused();
  });
});

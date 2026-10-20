import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";

/*
 * The browser tier of DatePicker. It owns what jsdom cannot give:
 *
 * 1. The popover's real geometry: it opens below the field, centred on it (the default
 *    placement is "bottom"), and stays inside the viewport.
 * 2. Focus across the portal: keyboard open lands in the calendar, Escape returns focus to the
 *    trigger, and an outside click dismisses without moving it into the popover.
 * 3. The group shell steps aside for the trigger's own focus ring: the shell draws its ring for a
 *    focused segment and not for the focused trigger (the `-picker-trigger` hook in
 *    date-input-group.css).
 * 4. The year picker laid over the day grid inside the popover.
 *
 * The spec addresses the story iframe directly (page.goto on /iframe.html), not the manager;
 * see ../AGENTS.md. The value is fixed by the story, so the cell labels below do not drift.
 */

const STORY = "components-datepicker--default-value";

const getTrigger = (page: Page) => page.locator('[data-slot="date-picker-trigger"]');

const openCalendar = async (page: Page) => {
  const popover = page.locator('[data-slot="date-picker-popover"]');

  await getTrigger(page).click();

  /* The entry animation fades opacity in from zero; visible is not yet settled. */
  await expect(popover).toBeVisible();
  await expect(popover).toHaveCSS("opacity", "1");

  return popover;
};

test.describe("DatePicker (browser)", () => {
  /*
   * Readiness sign before any interaction: a cold server serves an empty iframe before the
   * story renders, and assertions against nothing would pass silently.
   */
  test.beforeEach(async ({page}) => {
    await page.goto(`/iframe.html?id=${STORY}&globals=theme:default-light`);

    await expect(page.getByRole("heading", {level: 2})).toBeVisible();
  });

  test("opens below the field, centred on it, and stays in the viewport", async ({page}) => {
    await openCalendar(page);

    const group = page.locator('[data-slot="date-input-group"]');
    const popover = page.locator('[data-slot="date-picker-popover"]');
    const groupBox = await group.boundingBox();
    const popoverBox = await popover.boundingBox();
    const viewport = page.viewportSize();

    expect(groupBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();

    /* Below the field, not over it. */
    expect(popoverBox!.y).toBeGreaterThanOrEqual(groupBox!.y + groupBox!.height - 1);
    /* Centred on the field: the calendar is wider than the field, so it overhangs both sides. */
    const groupCentre = groupBox!.x + groupBox!.width / 2;
    const popoverCentre = popoverBox!.x + popoverBox!.width / 2;

    expect(Math.abs(popoverCentre - groupCentre)).toBeLessThanOrEqual(2);
    expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test("picking a day fills the field and closes the popover", async ({page}) => {
    const popover = await openCalendar(page);

    await popover.getByRole("button", {name: /August 20, 2026/}).click();

    await expect(popover).toBeHidden();
    await expect(page.getByRole("spinbutton", {name: /day/i})).toHaveText("20");
  });

  test("the keyboard opens the calendar, picks a day, and returns focus to the trigger", async ({
    page,
  }) => {
    const trigger = getTrigger(page);
    const popover = page.locator('[data-slot="date-picker-popover"]');

    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(popover).toBeVisible();
    /* Focus moves into the calendar, on the selected day. */
    await expect(popover.getByRole("button", {name: /August 15, 2026/})).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(popover).toBeHidden();
    await expect(page.getByRole("spinbutton", {name: /day/i})).toHaveText("16");
    await expect(trigger).toBeFocused();
  });

  test("Escape closes the popover and focus returns to the trigger", async ({page}) => {
    const trigger = getTrigger(page);
    const popover = await openCalendar(page);

    await page.keyboard.press("Escape");

    await expect(popover).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test("clicking outside closes the popover without changing the value", async ({page}) => {
    const popover = await openCalendar(page);

    /* The page behind an open popover is hidden from the accessibility tree: click by position. */
    await page.mouse.click(4, 4);

    await expect(popover).toBeHidden();
    await expect(page.getByRole("spinbutton", {name: /day/i})).toHaveText("15");
  });

  test("the year picker opens over the day grid and picks a year", async ({page}) => {
    const popover = await openCalendar(page);

    await popover.getByRole("button", {name: /August 2026/}).click();
    await popover.getByRole("button", {name: "2030"}).click();

    await expect(popover.getByRole("button", {name: /, 2030$/}).first()).toBeVisible();
  });

  test("the shell draws its focus ring for a segment and leaves it to the focused trigger", async ({
    page,
  }) => {
    const group = page.locator('[data-slot="date-input-group"]');
    const readShadow = () => group.evaluate((el) => getComputedStyle(el).boxShadow);

    await page.getByRole("spinbutton", {name: /day/i}).focus();
    const segmentShadow = await readShadow();

    await getTrigger(page).focus();
    const triggerShadow = await readShadow();

    expect(segmentShadow).not.toBe(triggerShadow);
  });
});

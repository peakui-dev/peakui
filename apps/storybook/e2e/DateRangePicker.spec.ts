import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";

/*
 * The browser tier of DateRangePicker. It owns what jsdom cannot give:
 *
 * 1. The popover's real geometry: it opens below the field, centred on it (the default
 *    placement is "bottom"), and stays inside the viewport.
 * 2. Focus across the portal: keyboard open lands in the calendar, Escape returns focus to the
 *    trigger, and an outside click dismisses without moving it into the popover.
 * 3. A range takes two picks: the first anchors it, the second fills both inputs and closes.
 * 4. The group shell steps aside for the trigger's own focus ring (the `-picker-trigger` hook in
 *    date-input-group.css).
 * 5. The year picker laid over the day grid inside the popover.
 *
 * The spec addresses the story iframe directly (page.goto on /iframe.html), not the manager;
 * see ../AGENTS.md. The value is fixed by the story (15-18 August 2026), so the cell labels
 * below do not drift.
 */

const STORY = "components-daterangepicker--default-value";

const getTrigger = (page: Page) => page.locator('[data-slot="date-range-picker-trigger"]');

const getDays = (page: Page) => page.getByRole("spinbutton", {name: /day/i});

const openCalendar = async (page: Page) => {
  const popover = page.locator('[data-slot="date-range-picker-popover"]');

  await getTrigger(page).click();

  /* The entry animation fades opacity in from zero; visible is not yet settled. */
  await expect(popover).toBeVisible();
  await expect(popover).toHaveCSS("opacity", "1");

  return popover;
};

test.describe("DateRangePicker (browser)", () => {
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
    const popover = page.locator('[data-slot="date-range-picker-popover"]');
    const groupBox = await group.boundingBox();
    const popoverBox = await popover.boundingBox();
    const viewport = page.viewportSize();

    expect(groupBox).not.toBeNull();
    expect(popoverBox).not.toBeNull();

    /* Below the field, not over it. */
    expect(popoverBox!.y).toBeGreaterThanOrEqual(groupBox!.y + groupBox!.height - 1);
    /* Centred on the field, unless the viewport edge pushed it: it must never overflow. */
    const groupCentre = groupBox!.x + groupBox!.width / 2;
    const popoverCentre = popoverBox!.x + popoverBox!.width / 2;

    if (popoverBox!.x > 0) {
      expect(Math.abs(popoverCentre - groupCentre)).toBeLessThanOrEqual(2);
    }
    expect(popoverBox!.x).toBeGreaterThanOrEqual(0);
    expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test("two picks fill both inputs and close the popover", async ({page}) => {
    const popover = await openCalendar(page);

    await popover.getByRole("button", {name: /August 20, 2026/}).click();
    /* The first pick only anchors the range. */
    await expect(popover).toBeVisible();

    await popover.getByRole("button", {name: /August 25, 2026/}).click();

    await expect(popover).toBeHidden();
    await expect(getDays(page).first()).toHaveText("20");
    await expect(getDays(page).last()).toHaveText("25");
  });

  test("the keyboard opens the calendar, picks a range, and returns focus to the trigger", async ({
    page,
  }) => {
    const trigger = getTrigger(page);
    const popover = page.locator('[data-slot="date-range-picker-popover"]');

    await trigger.focus();
    await page.keyboard.press("Enter");

    await expect(popover).toBeVisible();
    /* Focus moves into the calendar, on the start of the selected range. */
    await expect(popover.getByRole("button", {name: /August 15, 2026/})).toBeFocused();

    /* The first Enter anchors the range, an arrow key moves the end, the second Enter commits it. */
    await page.keyboard.press("Enter");
    await page.keyboard.press("ArrowRight");

    const endDay = await page.evaluate(
      () => /, August (\d+),/.exec(document.activeElement?.getAttribute("aria-label") ?? "")?.[1],
    );

    expect(endDay).toBeDefined();
    await page.keyboard.press("Enter");

    await expect(popover).toBeHidden();
    await expect(getDays(page).first()).toHaveText("15");
    await expect(getDays(page).last()).toHaveText(endDay!);
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
    await expect(getDays(page).first()).toHaveText("15");
    await expect(getDays(page).last()).toHaveText("18");
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

    await getDays(page).first().focus();
    const segmentShadow = await readShadow();

    await getTrigger(page).focus();
    const triggerShadow = await readShadow();

    expect(segmentShadow).not.toBe(triggerShadow);
  });
});

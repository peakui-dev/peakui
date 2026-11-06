import type {Page} from "@playwright/test";

import {expect, test} from "@playwright/test";
import {checkA11y, injectAxe} from "axe-playwright";

/*
 * Browser tier of ContextMenu. jsdom has no layout, no real scrolling and no touch pipeline, so
 * what lives here is exactly what it fakes: where the menu lands relative to the pointer, how it
 * moves at a viewport edge, where a keyboard open anchors, the touch long press, the scroll lock
 * and the dismissal by a right-click elsewhere.
 *
 * Stories are opened by the iframe URL, not through the manager: injectAxe reaches only the main
 * frame, so an audit by frame selector would inspect the iframe element instead of the story.
 *
 * Browsers: the repo's Playwright config has a single chromium project and this spec does not add
 * one. WebKit coverage (touch and Shift+F10 behave differently there) is deferred to a later
 * plan that adds the project.
 */

const THEMES = ["default-light", "default-dark"] as const;

/* Pointer-placed menus sit at the point (offset 0); a few px cover borders and subpixel rounding. */
const POINTER_TOLERANCE = 4;

/* A cold dev server compiles the preview bundle on the first request of each worker. */
const COLD = {timeout: 60_000} as const;

/*
 * One worker for the file, in order: six simultaneous first visits leave a cold dev server's
 * iframe on its loading spinner past any timeout worth setting. The first test pays for the
 * compile and the rest find it warm. `default`, not `serial`: one failure must not skip the rest.
 */
test.describe.configure({mode: "default"});

const openStory = async (page: Page, id: string, theme = "default-light") => {
  await page.goto(`/iframe.html?id=${id}&globals=theme:${theme}`);
  /* Every story renders a level-two heading: it is the sign that the preview mounted. */
  await expect(page.getByRole("heading", {level: 2})).toBeVisible(COLD);
};

const popoverLocator = (page: Page) => page.locator('[data-slot="context-menu-popover"]');

/* The entry animation runs opacity from zero; geometry and axe both want the settled state. */
const expectMenuSettled = async (page: Page) => {
  const menu = page.getByRole("menu");

  await expect(menu).toBeVisible();
  await expect(popoverLocator(page)).toHaveCSS("opacity", "1");

  return menu;
};

test.describe("ContextMenu — overlay in a real browser", () => {
  test.setTimeout(150_000);

  test("right-click places the menu at the pointer (bounding box within a few px)", async ({
    page,
  }) => {
    await openStory(page, "components-contextmenu--default");

    const region = page.getByText("Right-click this region");
    const regionBox = await region.boundingBox();

    expect(regionBox).not.toBeNull();

    const clickX = regionBox!.x + 60;
    const clickY = regionBox!.y + 30;

    await page.mouse.click(clickX, clickY, {button: "right"});
    await expectMenuSettled(page);

    const popoverBox = await popoverLocator(page).boundingBox();

    expect(popoverBox).not.toBeNull();
    expect(Math.abs(popoverBox!.x - clickX)).toBeLessThanOrEqual(POINTER_TOLERANCE);
    expect(Math.abs(popoverBox!.y - clickY)).toBeLessThanOrEqual(POINTER_TOLERANCE);

    await expect(page.getByRole("menuitem", {name: "Copy"})).toBeVisible();
  });

  /*
   * While the menu is open the modal popover leaves the rest of the page inert, so a right-click
   * elsewhere lands on BODY, not on the region. The menu must go away and the event must stay
   * un-prevented (the browser's own menu may show); before this was handled, the menu stayed open
   * under the native one.
   */
  test("a right-click elsewhere closes the menu and leaves the browser menu alone", async ({
    page,
  }) => {
    await openStory(page, "components-contextmenu--default");

    const regionBox = await page.getByText("Right-click this region").boundingBox();

    expect(regionBox).not.toBeNull();

    await page.mouse.click(regionBox!.x + 40, regionBox!.y + 20, {button: "right"});

    const menu = await expectMenuSettled(page);

    await page.evaluate(() => {
      const record = {prevented: [] as boolean[]};

      (window as unknown as {__contextMenuLog: typeof record}).__contextMenuLog = record;
      document.addEventListener("contextmenu", (event) => {
        record.prevented.push(event.defaultPrevented);
      });
    });

    /* Well clear of the first menu (about 220 px wide). */
    await page.mouse.click(regionBox!.x + 700, regionBox!.y + 50, {button: "right"});

    await expect(menu).toBeHidden();

    const log = await page.evaluate(
      () => (window as unknown as {__contextMenuLog: {prevented: boolean[]}}).__contextMenuLog,
    );

    expect(log.prevented).toEqual([false]);
  });

  test("flips at the bottom-right viewport edge (NearViewportEdge story)", async ({page}) => {
    await openStory(page, "components-contextmenu--near-viewport-edge");

    const viewport = page.viewportSize();

    expect(viewport).not.toBeNull();

    const regionBox = await page.getByText("Right-click this region").boundingBox();

    expect(regionBox).not.toBeNull();

    /* The bottom-right corner of the region, a few px inside it. */
    const clickX = regionBox!.x + regionBox!.width - 4;
    const clickY = regionBox!.y + regionBox!.height - 4;

    await page.mouse.click(clickX, clickY, {button: "right"});
    await expectMenuSettled(page);

    const popoverBox = await popoverLocator(page).boundingBox();

    expect(popoverBox).not.toBeNull();

    /* Stays inside the viewport on every side. */
    expect(popoverBox!.x).toBeGreaterThanOrEqual(0);
    expect(popoverBox!.y).toBeGreaterThanOrEqual(0);
    expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(viewport!.width);
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(viewport!.height);

    /* Opens upward and leftward from the pointer instead of hanging off the corner. */
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(clickY + POINTER_TOLERANCE);
    expect(popoverBox!.x).toBeLessThan(clickX);

    await expect(popoverLocator(page)).toHaveAttribute("data-placement", "top");
  });

  test("Shift+F10 anchors to the focused element and Escape returns focus to it", async ({
    page,
  }) => {
    await openStory(page, "components-contextmenu--with-native-escape");

    const link = page.getByRole("link", {name: "Right-click this link for the browser menu"});

    await link.focus();
    await expect(link).toBeFocused();

    const linkBox = await link.boundingBox();

    expect(linkBox).not.toBeNull();

    await page.keyboard.press("Shift+F10");

    const menu = await expectMenuSettled(page);
    const popoverBox = await popoverLocator(page).boundingBox();

    expect(popoverBox).not.toBeNull();

    /* Bottom-start corner of the focused element. */
    expect(Math.abs(popoverBox!.x - linkBox!.x)).toBeLessThanOrEqual(POINTER_TOLERANCE);
    expect(Math.abs(popoverBox!.y - (linkBox!.y + linkBox!.height))).toBeLessThanOrEqual(
      POINTER_TOLERANCE,
    );

    /* A keyboard open moves focus onto the first item. */
    await expect(page.getByRole("menuitem", {name: "Copy"})).toBeFocused();

    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(link).toBeFocused();
  });

  const openWithScrollableDocument = async (page: Page) => {
    await openStory(page, "components-contextmenu--default");

    /* The story page fits the viewport; give the document something to scroll. */
    await page.evaluate(() => {
      const spacer = document.createElement("div");

      spacer.style.height = "3000px";
      document.body.append(spacer);
    });

    const regionBox = await page.getByText("Right-click this region").boundingBox();

    expect(regionBox).not.toBeNull();

    await page.mouse.click(regionBox!.x + 60, regionBox!.y + 30, {button: "right"});

    return {
      /* A point on the page well clear of the menu, so a wheel there reaches the document. */
      clear: {x: regionBox!.x + 700, y: regionBox!.y + 20},
      menu: await expectMenuSettled(page),
    };
  };

  /*
   * The menu is modal and locks scroll, exactly like Dropdown (RAC closes on scroll only for a
   * non-modal popover), so no ancestor scroll can happen to close it: the page stays put.
   */
  test("the open menu is modal: the document is scroll-locked behind it", async ({page}) => {
    const {clear, menu} = await openWithScrollableDocument(page);

    await page.mouse.move(clear.x, clear.y);
    await page.mouse.wheel(0, 300);

    /* Give a (wrong) scroll time to land before asserting that it did not. */
    await page.waitForTimeout(300);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(menu).toBeVisible();

    /* After the menu closes the same wheel scrolls the page: the lock was the menu's doing. */
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await page.mouse.wheel(0, 300);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });

  test("Disabled does not open the custom menu and leaves the browser menu alone", async ({
    page,
  }) => {
    await openStory(page, "components-contextmenu--disabled");

    await page.evaluate(() => {
      const record = {prevented: [] as boolean[]};

      (window as unknown as {__contextMenuLog: typeof record}).__contextMenuLog = record;
      document.addEventListener("contextmenu", (event) => {
        record.prevented.push(event.defaultPrevented);
      });
    });

    const regionBox = await page.getByText(/Right-click this region/).boundingBox();

    expect(regionBox).not.toBeNull();

    await page.mouse.click(regionBox!.x + 40, regionBox!.y + 20, {button: "right"});

    const log = await page.evaluate(
      () => (window as unknown as {__contextMenuLog: {prevented: boolean[]}}).__contextMenuLog,
    );

    /* The event happened, and nobody cancelled it: the browser menu would show. */
    expect(log.prevented).toEqual([false]);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });

  test("a native-escape link does not open the custom menu, its region does", async ({page}) => {
    await openStory(page, "components-contextmenu--with-native-escape");

    await page.evaluate(() => {
      const record = {prevented: [] as boolean[]};

      (window as unknown as {__contextMenuLog: typeof record}).__contextMenuLog = record;
      document.addEventListener("contextmenu", (event) => {
        record.prevented.push(event.defaultPrevented);
      });
    });

    const link = page.getByRole("link", {name: "Right-click this link for the browser menu"});

    await link.click({button: "right"});

    const log = await page.evaluate(
      () => (window as unknown as {__contextMenuLog: {prevented: boolean[]}}).__contextMenuLog,
    );

    expect(log.prevented).toEqual([false]);
    await expect(page.getByRole("menu")).toHaveCount(0);

    /* Positive control: the rest of the same region does open it. */
    await page.getByText("Right-click here for the custom menu.").click({button: "right"});
    await expect(page.getByRole("menu")).toBeVisible();
  });

  /*
   * Controlled: the toggle button is outside the popover, so a press on it while the menu is open
   * is also an outside press that dismisses the menu (onOpenChange(false)) before the button's own
   * toggle runs. Only the closed-to-open direction is deterministic, so that is the one covered;
   * Escape closes it.
   */
  test("Controlled opens from the external toggle and Escape closes it", async ({page}) => {
    /* The toggle-while-open race (an outside press versus the toggle) is not exercised. */
    await openStory(page, "components-contextmenu--controlled");

    await expect(page.getByText("closed", {exact: true})).toBeVisible();

    await page.getByRole("button", {name: "Toggle menu"}).click();

    const menu = await expectMenuSettled(page);

    await expect(page.getByText("open", {exact: true})).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(menu).toBeHidden();
    await expect(page.getByText("closed", {exact: true})).toBeVisible();
  });

  for (const theme of THEMES) {
    test(`has no WCAG 2.2 AA violations with the menu open in ${theme}`, async ({page}) => {
      await openStory(page, "components-contextmenu--with-sections", theme);

      await page.getByText("Right-click this region").click({button: "right"});
      await expectMenuSettled(page);

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
});

test.describe("ContextMenu — touch", () => {
  test.setTimeout(150_000);
  test.use({hasTouch: true});

  test("a long press opens the menu at the finger and the release does not select", async ({
    page,
  }) => {
    await openStory(page, "components-contextmenu--default");

    const regionBox = await page.getByText("Right-click this region").boundingBox();

    expect(regionBox).not.toBeNull();

    const x = Math.round(regionBox!.x + 80);
    const y = Math.round(regionBox!.y + 40);
    const client = await page.context().newCDPSession(page);
    const touch = (type: "touchEnd" | "touchStart", points: {x: number; y: number}[]) =>
      client.send("Input.dispatchTouchEvent", {touchPoints: points, type});

    await touch("touchStart", [{x, y}]);

    /* Short of the 500 ms threshold nothing has opened. */
    await page.waitForTimeout(200);
    await expect(page.getByRole("menu")).toHaveCount(0);

    /*
     * Hold past the threshold; the hold itself is the thing under test. The Default story has no
     * onAction, so "the release does not select" is asserted as "the menu is still open past the
     * ghost window" (a selection would close it); the activation itself is covered in jsdom.
     */
    await page.waitForTimeout(500);

    const menu = await expectMenuSettled(page);
    const popoverBox = await popoverLocator(page).boundingBox();

    expect(popoverBox).not.toBeNull();
    expect(Math.abs(popoverBox!.x - x)).toBeLessThanOrEqual(POINTER_TOLERANCE);
    expect(Math.abs(popoverBox!.y - y)).toBeLessThanOrEqual(POINTER_TOLERANCE);

    await touch("touchEnd", []);

    /* The ghost-activation window is 400 ms: look past it. A selection would have closed the menu. */
    await page.waitForTimeout(600);
    await expect(menu).toBeVisible();
  });

  test("a short tap does not open the menu", async ({page}) => {
    await openStory(page, "components-contextmenu--default");

    const regionBox = await page.getByText("Right-click this region").boundingBox();

    expect(regionBox).not.toBeNull();

    await page.touchscreen.tap(regionBox!.x + 80, regionBox!.y + 40);
    await page.waitForTimeout(700);
    await expect(page.getByRole("menu")).toHaveCount(0);
  });
});

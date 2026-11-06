import type {SheetContextValue} from "@/components/sheet/context.ts";

import {act, cleanup, render} from "@peakui/testing/helpers";
import {createRef} from "react";

import {SheetContext} from "@/components/sheet/context.ts";
import {SheetScrollGuard} from "@/components/sheet/sheet-scroll-guard.tsx";
import {canScrollWithin, isElementInView} from "@/components/sheet/sheet-scroll.ts";
import {sheetScrollKeyDirection} from "@/components/sheet/sheet.utils.ts";

/*
 * The guard against scrolls nobody asked for: the primitive's focus scroll onto an element already
 * in view, and scroll keys that nothing inside the sheet takes. jsdom has no layout, so the rects
 * and scroll geometry are stubbed per element; what the browser does with them is the e2e tier's.
 */

const rect = (top: number, bottom: number, left = 0, right = 100) =>
  ({
    bottom,
    height: bottom - top,
    left,
    right,
    top,
    width: right - left,
    x: left,
    y: top,
  }) as DOMRect;

/** Gives an element a box and, optionally, a scroll geometry along y. */
function shape(
  element: HTMLElement,
  box: DOMRect,
  scroll?: {client: number; position: number; size: number},
) {
  element.getBoundingClientRect = () => box;
  if (!scroll) return;
  Object.defineProperty(element, "scrollHeight", {configurable: true, value: scroll.size});
  Object.defineProperty(element, "clientHeight", {configurable: true, value: scroll.client});
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    value: scroll.position,
    writable: true,
  });
}

const key = (name: string, modifiers: Partial<KeyboardEventInit> = {}) => ({
  altKey: false,
  ctrlKey: false,
  key: name,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe("sheetScrollKeyDirection", () => {
  it("maps the vertical scroll keys to up (-1) and down (1)", () => {
    for (const name of ["ArrowUp", "PageUp", "Home"]) {
      expect(sheetScrollKeyDirection(key(name), "y")).toBe(-1);
    }
    for (const name of ["ArrowDown", "PageDown", "End", " "]) {
      expect(sheetScrollKeyDirection(key(name), "y")).toBe(1);
    }
    expect(sheetScrollKeyDirection(key(" ", {shiftKey: true}), "y")).toBe(-1);
    expect(sheetScrollKeyDirection(key("ArrowLeft"), "y")).toBeNull();
  });

  it("maps only the horizontal arrows on the x axis", () => {
    expect(sheetScrollKeyDirection(key("ArrowLeft"), "x")).toBe(-1);
    expect(sheetScrollKeyDirection(key("ArrowRight"), "x")).toBe(1);

    for (const name of ["ArrowUp", "PageDown", "Home", "End", " "]) {
      expect(sheetScrollKeyDirection(key(name), "x")).toBeNull();
    }
  });

  it("leaves Alt, Ctrl and Meta chords and other keys to the browser", () => {
    expect(sheetScrollKeyDirection(key("ArrowUp", {altKey: true}), "y")).toBeNull();
    expect(sheetScrollKeyDirection(key("Home", {ctrlKey: true}), "y")).toBeNull();
    expect(sheetScrollKeyDirection(key("ArrowLeft", {metaKey: true}), "x")).toBeNull();
    expect(sheetScrollKeyDirection(key("Tab"), "y")).toBeNull();
    expect(sheetScrollKeyDirection(key("Enter"), "y")).toBeNull();
  });
});

describe("isElementInView", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is true only for a box entirely inside the viewport", () => {
    const element = document.createElement("div");
    const {innerHeight, innerWidth} = window;

    shape(element, rect(10, 50));
    expect(isElementInView(element)).toBe(true);

    shape(element, rect(innerHeight - 20, innerHeight + 20));
    expect(isElementInView(element)).toBe(false);

    shape(element, rect(-5, 20));
    expect(isElementInView(element)).toBe(false);

    shape(element, rect(10, 50, innerWidth - 50, innerWidth + 10));
    expect(isElementInView(element)).toBe(false);
  });

  it("is false for an element with no box", () => {
    const element = document.createElement("div");

    shape(element, rect(0, 0, 0, 0));
    expect(isElementInView(element)).toBe(false);
  });

  it("measures against the visual viewport, so a software keyboard's area is out of view", () => {
    const element = document.createElement("div");

    vi.stubGlobal("visualViewport", {height: 300, offsetLeft: 0, offsetTop: 0, width: 1024});
    shape(element, rect(320, 360));
    expect(isElementInView(element)).toBe(false);
    shape(element, rect(200, 260));
    expect(isElementInView(element)).toBe(true);
  });
});

describe("canScrollWithin", () => {
  const tree = () => {
    const scroller = document.createElement("div");
    const body = document.createElement("div");
    const button = document.createElement("button");

    scroller.append(body);
    body.append(button);
    document.body.append(scroller);

    return {body, button, scroller};
  };

  afterEach(() => document.body.replaceChildren());

  it("finds a container between the target and the scroller that can still scroll that way", () => {
    const {body, button, scroller} = tree();

    body.style.overflowY = "auto";
    shape(body, rect(0, 100), {client: 100, position: 0, size: 300});

    expect(canScrollWithin(button, scroller, "y", 1)).toBe(true);
    expect(canScrollWithin(button, scroller, "y", -1)).toBe(false);

    body.scrollTop = 200;
    expect(canScrollWithin(button, scroller, "y", 1)).toBe(false);
    expect(canScrollWithin(button, scroller, "y", -1)).toBe(true);
  });

  it("ignores a container that clips instead of scrolling, and one with nothing to scroll", () => {
    const {body, button, scroller} = tree();

    body.style.overflowY = "hidden";
    shape(body, rect(0, 100), {client: 100, position: 50, size: 300});
    expect(canScrollWithin(button, scroller, "y", 1)).toBe(false);

    body.style.overflowY = "auto";
    shape(body, rect(0, 100), {client: 100, position: 0, size: 100});
    expect(canScrollWithin(button, scroller, "y", 1)).toBe(false);
  });

  it("does not count the sheet's scroller or anything outside it", () => {
    const {button, scroller} = tree();

    scroller.style.overflowY = "auto";
    shape(scroller, rect(0, 100), {client: 100, position: 50, size: 300});

    expect(canScrollWithin(button, scroller, "y", 1)).toBe(false);
    expect(canScrollWithin(button, scroller, "y", -1)).toBe(false);
  });

  it("reads a right-to-left container's negative scrollLeft as its distance from the right edge", () => {
    const {body, button, scroller} = tree();

    body.style.overflowX = "auto";
    body.style.direction = "rtl";
    Object.defineProperty(body, "scrollWidth", {value: 300});
    Object.defineProperty(body, "clientWidth", {value: 100});
    // At the right edge, its start: it can scroll left only.
    Object.defineProperty(body, "scrollLeft", {configurable: true, value: 0, writable: true});
    expect(canScrollWithin(button, scroller, "x", -1)).toBe(true);
    expect(canScrollWithin(button, scroller, "x", 1)).toBe(false);

    body.scrollLeft = -200;
    expect(canScrollWithin(button, scroller, "x", -1)).toBe(false);
    expect(canScrollWithin(button, scroller, "x", 1)).toBe(true);
  });
});

describe("SheetScrollGuard", () => {
  const context = (isOpen = true) =>
    ({
      closeSheet: () => {},
      isDetached: false,
      isDismissable: true,
      isNested: false,
      isOpen,
      isTriggerControlled: false,
      placement: "bottom",
      setIsOpen: () => {},
    }) satisfies SheetContextValue;

  /*
   * An open sheet's DOM, as far as the guard reads it: an overlay holding the snap scroller, a
   * dialog with a handle and two buttons (one in view, one below it), a text field, and a trigger
   * outside. The scroller rests at 180.
   */
  const mount = ({
    isOpen = true,
    swipeDirection = "bottom",
  }: {isOpen?: boolean; swipeDirection?: "bottom" | "right"} = {}) => {
    const overlayRef = createRef<HTMLDivElement>();
    const view = render(
      <SheetContext value={context(isOpen)}>
        <div ref={overlayRef}>
          <div data-sheet-scroll="">
            <div data-slot="sheet-dialog" role="dialog" tabIndex={-1}>
              <div
                aria-label="Resize sheet"
                aria-valuenow={25}
                data-testid="handle"
                role="slider"
                tabIndex={0}
              />
              <button type="button">In view</button>
              <button type="button">Below</button>
              <input aria-label="Name" />
              <div data-testid="body">
                <button type="button">In body</button>
              </div>
            </div>
          </div>
        </div>
        <button type="button">Outside</button>
        <SheetScrollGuard overlayRef={overlayRef} swipeDirection={swipeDirection} />
      </SheetContext>,
    );
    const scroller = view.container.querySelector<HTMLElement>("[data-sheet-scroll]")!;
    const dialog = view.container.querySelector<HTMLElement>('[data-slot="sheet-dialog"]')!;
    const byName = (name: string) => view.getByRole("button", {name});

    shape(scroller, rect(0, 1440), {client: 1440, position: 180, size: 2160});
    Object.defineProperty(scroller, "scrollLeft", {configurable: true, value: 640, writable: true});
    shape(dialog, rect(540, 1260));
    shape(view.getByTestId("handle"), rect(540, 570));
    shape(byName("In view"), rect(600, 640));
    shape(byName("Below"), rect(900, 940));
    shape(view.getByRole("textbox"), rect(650, 690));
    shape(byName("In body"), rect(700, 710));

    return {byName, dialog, scroller, view};
  };

  /** What the primitive's focus() does: focus, then (on a desktop) start a scroll at once. */
  const focusAndScroll = (element: HTMLElement, scroller: HTMLElement, to = 360) => {
    element.focus();
    scroller.scrollTop = to;
  };

  const flushMicrotasks = () => act(() => Promise.resolve());

  beforeEach(() => {
    // jsdom has no viewport size of its own worth trusting; pin it.
    vi.stubGlobal("innerHeight", 720);
    vi.stubGlobal("innerWidth", 1280);
    vi.stubGlobal("visualViewport", undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe("focus scroll", () => {
    it("cancels the scroll of a focus that moves within the sheet onto an element in view", async () => {
      const {dialog, scroller, view} = mount();

      dialog.focus();
      focusAndScroll(view.getByTestId("handle"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(180);
    });

    it("keeps the scroll that brings an element out of view into it", async () => {
      const {byName, dialog, scroller} = mount();

      dialog.focus();
      focusAndScroll(byName("Below"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(360);
    });

    it("leaves the first focus and a focus coming from outside the sheet to the primitive", async () => {
      const {byName, scroller} = mount();

      byName("Outside").focus();
      focusAndScroll(byName("In view"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(360);
    });

    it("keeps the scroll of a text field, which moves it above a software keyboard", async () => {
      const {dialog, scroller, view} = mount();

      dialog.focus();
      focusAndScroll(view.getByRole("textbox"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(360);
    });

    it("leaves a scroller held by a handle drag alone", async () => {
      const {dialog, scroller, view} = mount();

      dialog.focus();
      scroller.setAttribute("data-handle-dragging", "");
      focusAndScroll(view.getByTestId("handle"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(360);
    });

    it("cancels a scroll the primitive defers (a touch screen), until the hold runs out", async () => {
      vi.useFakeTimers();

      const {byName, dialog, scroller, view} = mount();

      dialog.focus();
      view.getByTestId("handle").focus();
      await flushMicrotasks();
      expect(scroller.scrollTop).toBe(180);

      // Frames later, the deferred scroll starts moving the scroller.
      scroller.scrollTop = 184;
      scroller.dispatchEvent(new Event("scroll"));
      expect(scroller.scrollTop).toBe(180);

      // Once the hold is over, a scroll is no longer the focus's.
      byName("In view").focus();
      await flushMicrotasks();
      act(() => vi.advanceTimersByTime(1000));
      scroller.scrollTop = 200;
      scroller.dispatchEvent(new Event("scroll"));
      expect(scroller.scrollTop).toBe(200);
    });

    it("stops cancelling once the person scrolls or presses a key", async () => {
      const {dialog, scroller, view} = mount();

      for (const input of ["keydown", "pointerdown", "touchstart", "wheel"]) {
        dialog.focus();
        view.getByTestId("handle").focus();
        await flushMicrotasks();

        document.dispatchEvent(new Event(input));
        scroller.scrollTop = 360;
        scroller.dispatchEvent(new Event("scroll"));
        expect(scroller.scrollTop, input).toBe(360);
        scroller.scrollTop = 180;
      }
    });

    it("does nothing while the sheet is closed", async () => {
      const {dialog, scroller, view} = mount({isOpen: false});

      dialog.focus();
      focusAndScroll(view.getByTestId("handle"), scroller);
      await flushMicrotasks();

      expect(scroller.scrollTop).toBe(360);
    });
  });

  describe("scroll keys", () => {
    /** Dispatches a key as the browser does; true when its default (the scroll) was prevented. */
    const press = (target: Element, name: string, init: KeyboardEventInit = {}) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: name,
        ...init,
      });

      target.dispatchEvent(event);

      return event.defaultPrevented;
    };

    it("prevents the scroll keys on the dialog, the handle and a control that cannot scroll", () => {
      const {byName, dialog, view} = mount();

      for (const name of ["PageUp", "Home", "ArrowUp", "PageDown", "End", "ArrowDown", " "]) {
        expect(press(dialog, name), name).toBe(true);
        expect(press(view.getByTestId("handle"), name), name).toBe(true);
      }
      expect(press(byName("In view"), "PageUp")).toBe(true);
      expect(press(dialog, " ", {shiftKey: true})).toBe(true);
    });

    it("leaves keys that are not scrolls, chords, and Space on a button alone", () => {
      const {byName, dialog} = mount();

      expect(press(dialog, "Tab")).toBe(false);
      expect(press(dialog, "Enter")).toBe(false);
      expect(press(dialog, "ArrowLeft")).toBe(false);
      expect(press(dialog, "ArrowUp", {altKey: true})).toBe(false);
      expect(press(dialog, "Home", {ctrlKey: true})).toBe(false);
      expect(press(byName("In view"), " ")).toBe(false);
    });

    it("leaves keys to a text field and to a body that can still scroll that way", () => {
      const {byName, view} = mount();
      const body = view.getByTestId("body");

      expect(press(view.getByRole("textbox"), "Home")).toBe(false);

      body.style.overflowY = "auto";
      shape(body, rect(600, 700), {client: 100, position: 0, size: 400});
      expect(press(byName("In body"), "PageDown")).toBe(false);
      // At its start, nothing inside can go up: the key would move the sheet.
      expect(press(byName("In body"), "PageUp")).toBe(true);
    });

    it("leaves keys outside the sheet alone", () => {
      const {byName} = mount();

      expect(press(byName("Outside"), "PageUp")).toBe(false);
    });

    it("on a horizontal sheet claims only the horizontal arrows", () => {
      const {dialog} = mount({swipeDirection: "right"});

      expect(press(dialog, "ArrowLeft")).toBe(true);
      expect(press(dialog, "ArrowRight")).toBe(true);
      expect(press(dialog, "ArrowUp")).toBe(false);
      expect(press(dialog, "PageDown")).toBe(false);
    });

    it("does nothing while the sheet is closed", () => {
      const {dialog} = mount({isOpen: false});

      expect(press(dialog, "PageUp")).toBe(false);
    });
  });
});

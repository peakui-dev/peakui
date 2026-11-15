"use client";

import type {RefObject} from "react";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {useEffect} from "react";

import {useSheetContext} from "./context.ts";
import {canScrollWithin, findSheetScroller, isElementInView} from "./sheet-scroll.ts";
import {sheetScrollKeyDirection} from "./sheet.utils.ts";

/** Input that starts a scroll of the person's own: after it, no focus scroll is held back. */
const USER_INPUT = ["keydown", "pointerdown", "touchstart", "wheel"] as const;

/**
 * How long (ms) after a focus a touch screen's deferred focus scroll is still held back. The
 * primitive waits a few frames, and up to 600 ms for a software keyboard, before it scrolls.
 */
const FOCUS_HOLD_MS = 700;

/**
 * Which keys a focused element acts on itself, so that they are not scrolls:
 * - `all`: text entry and a select (caret movement, typing, option choice);
 * - `range`: arrows, Page keys, Home and End change the value;
 * - `radio`: arrows move the selection, Space selects;
 * - `space`: Space activates (buttons, a summary, a checkbox or switch, button-like inputs);
 * - `none`: the browser scrolls for every scroll key.
 */
type KeyUse = "all" | "none" | "radio" | "range" | "space";

/** Input types that do not take text; any other type (and an unknown one) is text entry. */
const SPACE_INPUT = new Set(["button", "checkbox", "color", "file", "image", "reset", "submit"]);

function keyUse(target: Element): KeyUse {
  if (target instanceof HTMLInputElement) {
    if (target.type === "range") return "range";
    if (target.type === "radio") return "radio";

    return SPACE_INPUT.has(target.type) ? "space" : "all";
  }
  if (
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return "all";
  }

  return target instanceof HTMLButtonElement || target.localName === "summary" ? "space" : "none";
}

/** Whether the focused element acts on the key itself, so the key is not a scroll. */
function takesKey(target: Element, key: string): boolean {
  switch (keyUse(target)) {
    case "all":
      return true;
    case "range":
      return key !== " ";
    case "radio":
      return key === " " || key.startsWith("Arrow");
    case "space":
      return key === " ";
    default:
      return false;
  }
}

/**
 * Whether focusing the element opens a software keyboard. Its focus scroll then moves the field
 * above the keyboard, which is the scroll the person needs, so it is never held back.
 */
function isTextEntry(target: Element): boolean {
  return keyUse(target) === "all" && !(target instanceof HTMLSelectElement);
}

/**
 * Whether the primitive may defer its focus scroll: it does when the device has touch points
 * (react-aria `runAfterKeyboard`, gated on `navigator.maxTouchPoints > 0` or an open keyboard).
 */
function mayDeferFocusScroll(): boolean {
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}

/*
 * Keeps keyboard use from moving the sheet. The sheet moves by scrolling, and two kinds of scroll
 * reach its scroller without anyone asking for them. This component renders nothing.
 *
 * Focus. A dependency on the primitive's internals, pinned to react-aria 3.53.1 and
 * react-aria-components 1.22: the Sheet's overlay opens with `UNSTABLE_overrideFocus`, so while it
 * is open react-aria's `usePreventScroll` replaces `HTMLElement.prototype.focus` with one that
 * focuses with `preventScroll` and then calls its own `scrollIntoView`. That function's in-view
 * test, `targetRect.bottom > scrollableRect.top + nextTarget.clientHeight`, uses the focused
 * element's height instead of the scroller's, so it fires for nearly any element, and its smooth
 * `scrollTo` centring the element moves the snap scroller to another point or to its closed end.
 *
 * When focus moves within the open sheet onto an element already in view, that one `scrollTo` call
 * on the snap scroller is held back; nothing is written to the scroller, so a scroll already in
 * flight (a handle step) and one a focus handler starts itself are kept. The call comes within the
 * same `focus()`, after the focus events have been dispatched, so the hold is armed by the last
 * `focusin` listener (on the window, bubbling) and dropped in a microtask. On a touch screen the
 * primitive defers it by several frames, so there the hold lasts until the first such call, the
 * person's own input, or FOCUS_HOLD_MS. An element out of view keeps the scroll, which is what
 * brings it into view.
 *
 * The e2e spec has a canary for the override ("canary: the primitive overrides focus() ..."). When
 * it fails, check whether the primitive still needs this guard, and remove it if not.
 *
 * Keys. Scroll keys that nothing inside the sheet takes (a body that can still scroll that way, a
 * text field, a widget that handles the key) would scroll the snap scroller: toward the closed end
 * or toward full size. Their default is prevented. The handle is the keyboard way to resize the
 * sheet, and Escape the way to close it.
 */
function SheetScrollGuard({
  overlayRef,
  swipeDirection,
}: Pick<SheetRenderProps, "swipeDirection"> & {
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const {isOpen} = useSheetContext();
  const axis =
    swipeDirection === "left" || swipeDirection === "right" || swipeDirection === "horizontal"
      ? "x"
      : "y";

  useEffect(() => {
    if (!isOpen) return;

    const doc = overlayRef.current?.ownerDocument ?? document;
    const win = doc.defaultView ?? window;
    const getScroller = () => (overlayRef.current ? findSheetScroller(overlayRef.current) : null);
    /** Ends the current hold, if any: puts the scroller's own scrollTo back. */
    let release = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;

    /** Holds back the next smooth scrollTo on the scroller, until released. */
    const hold = (scroller: HTMLElement) => {
      release();

      const own = Object.getOwnPropertyDescriptor(scroller, "scrollTo");
      const original = scroller.scrollTo;
      let active = true;

      release = () => {
        if (!active) return;
        active = false;
        clearTimeout(timer);
        if (own) Object.defineProperty(scroller, "scrollTo", own);
        else Reflect.deleteProperty(scroller, "scrollTo");
        release = () => {};
      };

      Object.defineProperty(scroller, "scrollTo", {
        configurable: true,
        value: (...args: unknown[]) => {
          const [options] = args;

          // The primitive's centring scroll is smooth; anything else is someone else's.
          if (
            typeof options === "object" &&
            options !== null &&
            (options as ScrollToOptions).behavior === "smooth"
          ) {
            release();

            return;
          }

          return Reflect.apply(original, scroller, args);
        },
        writable: true,
      });
    };

    const onFocusIn = (event: FocusEvent) => {
      const scroller = getScroller();
      const {relatedTarget, target} = event;

      if (!scroller || !(target instanceof Element) || !scroller.contains(target)) return;
      // Only a focus that moves within the open sheet: its first focus, and focus coming back from
      // outside (a nested sheet, the trigger), are the primitive's own to place.
      if (!(relatedTarget instanceof Node) || !scroller.contains(relatedTarget)) return;
      if (scroller.hasAttribute("data-handle-dragging") || isTextEntry(target)) return;
      if (!isElementInView(target)) return;

      hold(scroller);

      if (mayDeferFocusScroll()) {
        timer = setTimeout(() => release(), FOCUS_HOLD_MS);
      } else {
        // On a desktop the call has come, or will not, by the time the focus() call returns.
        const ending = release;

        queueMicrotask(() => ending());
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const scroller = getScroller();
      const {target} = event;

      if (!scroller || !(target instanceof Element) || !scroller.contains(target)) return;

      const direction = sheetScrollKeyDirection(event, axis);

      if (direction === null || takesKey(target, event.key)) return;
      if (canScrollWithin(target, scroller, axis, direction)) return;

      event.preventDefault();
    };

    const onUserInput = () => release();

    // Bubbling, on the window: after every other focus handler, so a scroll one of them starts is
    // not held back.
    win.addEventListener("focusin", onFocusIn);
    // Bubbling, on the document: it runs after the handlers inside the sheet, so a key one of them
    // has taken (the slider's arrows, a menu's) is already marked and left alone. A handler that
    // calls stopPropagation() without preventDefault() keeps the key from reaching this listener,
    // so the browser scrolls for it: this fails open.
    doc.addEventListener("keydown", onKeyDown);
    for (const type of USER_INPUT) {
      doc.addEventListener(type, onUserInput, {capture: true, passive: true});
    }

    return () => {
      release();
      win.removeEventListener("focusin", onFocusIn);
      doc.removeEventListener("keydown", onKeyDown);
      for (const type of USER_INPUT) doc.removeEventListener(type, onUserInput, {capture: true});
    };
  }, [axis, isOpen, overlayRef]);

  return null;
}

export {SheetScrollGuard};

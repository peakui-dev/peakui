"use client";

import type {RefObject} from "react";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {useEffect} from "react";

import {useSheetContext} from "./context.ts";
import {
  canScrollWithin,
  findSheetScroller,
  isElementInView,
  readSheetScroll,
  writeSheetScroll,
} from "./sheet-scroll.ts";
import {sheetScrollKeyDirection} from "./sheet.utils.ts";

/** Input that starts a scroll of the person's own: after it, nothing of a focus is cancelled. */
const USER_INPUT = ["keydown", "pointerdown", "touchstart", "wheel"] as const;

/**
 * How long (ms) after a focus its scroll is still cancelled. On a touch screen the primitive waits
 * a few frames, and up to 600 ms for a software keyboard, before it scrolls.
 */
const FOCUS_HOLD_MS = 700;

/** Input types that take text, and so open a software keyboard. */
const TEXT_INPUT =
  /^(?:email|number|password|search|tel|text|url|date|datetime-local|month|time|week)$/;

/**
 * Whether focusing the element opens a software keyboard. Its focus scroll then moves the field
 * above the keyboard, which is the scroll the person needs, so it is never cancelled.
 */
function isTextEntry(target: Element): boolean {
  return (
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLInputElement && TEXT_INPUT.test(target.type)) ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/**
 * Whether the element acts on the key itself, so the key is not a scroll: text entry and native
 * form controls take every key, and a button or a summary takes Space as its activation.
 */
function consumesKey(target: Element, key: string): boolean {
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  ) {
    return true;
  }

  return key === " " && (target instanceof HTMLButtonElement || target.localName === "summary");
}

/*
 * Keeps keyboard use from moving the sheet. The sheet moves by scrolling, and two kinds of scroll
 * reach its scroller without anyone asking for them. This component renders nothing.
 *
 * Focus. While a sheet is open the primitive's scroll lock replaces `focus()` with one that, after
 * focusing, scrolls the element's scroll parent to centre it. Its "already in view" test compares
 * the element against its own height rather than the scroller's, so it fires for nearly any
 * element; the snap scroller then rests at another point, or at its closed end. When focus moves
 * within the open sheet to an element already in view, that scroll is cancelled by putting the
 * scroller back where it was: the primitive asks for it within the same `focus()` call, or two
 * frames later on a touch screen (where it first waits to see if a software keyboard opens). An
 * element out of view keeps the scroll, which is what brings it into view.
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
    const getScroller = () => (overlayRef.current ? findSheetScroller(overlayRef.current) : null);
    /** The scroller and the position a focus started from, while its focus scroll is cancelled. */
    let held: {position: number; scroller: HTMLElement} | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const restore = () => {
      if (!held) return;

      const {position, scroller} = held;

      // A drag owns the scroller; a scroller gone with its sheet has nothing to restore.
      if (!scroller.isConnected || scroller.hasAttribute("data-handle-dragging")) {
        release();

        return;
      }

      // Writing the position, even the one it is already at, also ends a smooth scroll in flight.
      writeSheetScroll(scroller, axis, position);
    };

    /** A scroll that starts while held is the deferred focus scroll: put it back at once. */
    const onScroll = () => {
      if (held && Math.abs(readSheetScroll(held.scroller, axis) - held.position) > 0.5) restore();
    };

    function release() {
      clearTimeout(timer);
      held?.scroller.removeEventListener("scroll", onScroll);
      held = null;
    }

    const onFocusIn = (event: FocusEvent) => {
      const scroller = getScroller();
      const {relatedTarget, target} = event;

      if (!scroller || !(target instanceof Element) || !scroller.contains(target)) return;
      // Only a focus that moves within the open sheet: its first focus, and focus coming back from
      // outside (a nested sheet, the trigger), are the primitive's own to place.
      if (!(relatedTarget instanceof Node) || !scroller.contains(relatedTarget)) return;
      if (scroller.hasAttribute("data-handle-dragging") || isTextEntry(target)) return;
      if (!isElementInView(target)) return;

      release();
      held = {position: readSheetScroll(scroller, axis), scroller};
      scroller.addEventListener("scroll", onScroll, {passive: true});
      timer = setTimeout(release, FOCUS_HOLD_MS);
      // On a desktop the primitive has asked for its smooth scroll by the time this runs, and no
      // frame of it has been drawn: writing the position back ends it before it moves.
      queueMicrotask(restore);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      const scroller = getScroller();
      const {target} = event;

      if (!scroller || !(target instanceof Element) || !scroller.contains(target)) return;

      const direction = sheetScrollKeyDirection(event, axis);

      if (direction === null || consumesKey(target, event.key)) return;
      if (canScrollWithin(target, scroller, axis, direction)) return;

      event.preventDefault();
    };

    doc.addEventListener("focusin", onFocusIn, true);
    // Bubbling, on the document: it runs after the handlers inside the sheet, so a key one of them
    // has taken (the slider's arrows, a menu's) is already marked and left alone.
    doc.addEventListener("keydown", onKeyDown);
    for (const type of USER_INPUT)
      doc.addEventListener(type, release, {capture: true, passive: true});

    return () => {
      release();
      doc.removeEventListener("focusin", onFocusIn, true);
      doc.removeEventListener("keydown", onKeyDown);
      for (const type of USER_INPUT) doc.removeEventListener(type, release, {capture: true});
    };
  }, [axis, isOpen, overlayRef]);

  return null;
}

export {SheetScrollGuard};

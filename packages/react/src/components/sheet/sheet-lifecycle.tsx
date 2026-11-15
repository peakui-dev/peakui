"use client";

import type {RefObject} from "react";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {useCallback, useEffect, useRef} from "react";

import {useMediaQuery} from "../../hooks/use-media-query.ts";
import {useSafeLayoutEffect} from "../../hooks/use-safe-layout-effect.ts";

import {useSheetContext} from "./context.ts";
import {
  findSheetScroller,
  getSheetViewportLength,
  isSheetPanelOnScreen,
  readSheetScroll,
  scrollSheetTo,
  snapScrollPosition,
} from "./sheet-scroll.ts";

/** Frames after which the settle check gives up (about four seconds at 60fps). */
const MAX_SETTLE_FRAMES = 240;
/** Frames the scroller must stand still before a settle check trusts its position. */
const STATIONARY_FRAMES = 2;
/** Frames between the scroll-ends an exited sheet repeats until the primitive unmounts it. */
const SCROLL_END_INTERVAL = 30;

/*
 * What a sheet is doing is told by its scroller, not by a timer: the primitive animates by
 * scrolling, so an enter or exit is over when the scroll has ended and the panel is where the open
 * state says it should be. This component renders nothing. It reports each settled state once to
 * `onAnimationEnd`, and carries a closed overlay's scroller to its closed position when the
 * primitive's own exit scroll did not run.
 *
 * A `scrollend` event is the fast signal, but it can come before a listener exists, it is not
 * fired for a scroll that goes nowhere, and some browsers lack it. A bounded per-frame check backs
 * it up: both ask the same question (is the panel where the state says it should be?) through
 * `finishScroll`, so a scroll that stopped short reports nothing either way.
 */
function SheetLifecycle({
  overlayRef,
  swipeDirection,
}: SheetRenderProps & {
  overlayRef: RefObject<HTMLDivElement | null>;
}) {
  const {isOpen, onAnimationEnd} = useSheetContext();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const bidirectional = swipeDirection === "horizontal" || swipeDirection === "vertical";
  const axis =
    swipeDirection === "left" || swipeDirection === "right" || swipeDirection === "horizontal"
      ? "x"
      : "y";
  // Whether the sheet's open position is at the far end of the scroll range.
  const after = swipeDirection === "bottom" || swipeDirection === "right" || bidirectional;

  /** The last state delivered to `onAnimationEnd`: a state is delivered once, not once per visit. */
  const reported = useRef<boolean | undefined>(undefined);
  /** True from a reopen during an exit until the scroller is back at rest. */
  const restoring = useRef(false);
  /** Where the scroller last rested while open. */
  const restingScroll = useRef<number | null>(null);
  /** What the long-lived callbacks read, so a stale closure never reports an old state. */
  const latest = useRef({isOpen, onAnimationEnd, reducedMotion});

  useSafeLayoutEffect(() => {
    // The overlay is still mounted from an exit that the primitive's enter will not replay.
    if (isOpen && !latest.current.isOpen) restoring.current = true;
    latest.current = {isOpen, onAnimationEnd, reducedMotion};
  }, [isOpen, onAnimationEnd, reducedMotion]);

  const notify = useCallback((open: boolean) => {
    if (open) restoring.current = false;
    if (reported.current === open) return;
    reported.current = open;
    latest.current.onAnimationEnd?.(open);
  }, []);

  /** Reports the state the scroller has settled in, if it matches the state asked for. */
  const finishScroll = useCallback(() => {
    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    // A handle drag scrolls the scroller itself and settles it on its own.
    if (scroller?.hasAttribute("data-handle-dragging")) return;

    const visible = !!scroller && isSheetPanelOnScreen(scroller);

    // The scroll ended somewhere other than the requested state: it was interrupted.
    if (visible !== latest.current.isOpen) return;

    if (latest.current.isOpen && scroller) {
      restingScroll.current = readSheetScroll(scroller, axis);
    }
    notify(latest.current.isOpen);
  }, [axis, notify, overlayRef]);

  /*
   * Reopening during an exit: the primitive's enter runs once, on mount, and its exit scroll may
   * already be under way, so the scroller is always sent back to rest here. A new scroll replaces
   * the one in flight; skipping it because the scroller still looks close to rest would let the
   * exit carry on and close a sheet the owner has just reopened.
   */
  useEffect(() => {
    if (!isOpen || !restoring.current) return;

    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    if (!scroller) return;

    if (restingScroll.current === null) {
      // Interrupted before its first rest: read the primitive's own opening marker, the first
      // snap point or the fully-entered position.
      const initial = scroller.querySelector<HTMLElement>("[data-sheet-initial]");
      const marker =
        initial ??
        (bidirectional
          ? scroller.children[1]
          : after
            ? scroller.lastElementChild
            : scroller.firstElementChild);

      if (!(marker instanceof HTMLElement)) return;

      const align = initial ? (after ? "start" : "end") : after && !bidirectional ? "end" : "start";

      restingScroll.current = snapScrollPosition(scroller, marker, axis, align);
    }

    // The settle check below reports it: a scroll to where the scroller already is ends no scroll.
    scrollSheetTo(scroller, axis, restingScroll.current, latest.current.reducedMotion);
  }, [after, axis, bidirectional, isOpen, overlayRef]);

  /*
   * While open and not yet reported, watch the scroller each frame and report once it stands still
   * with the panel on screen. Bounded, and cancelled on cleanup.
   */
  useEffect(() => {
    if (!isOpen) return;

    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    if (!scroller) return;

    let previous: number | undefined;
    let stationaryFrames = 0;
    let frames = 0;
    let frame = 0;
    const check = () => {
      if (!latest.current.isOpen || (reported.current === true && !restoring.current)) return;

      const current = readSheetScroll(scroller, axis);

      stationaryFrames = current === previous ? stationaryFrames + 1 : 0;
      previous = current;
      if (stationaryFrames >= STATIONARY_FRAMES) finishScroll();
      if (reported.current === true && !restoring.current) return;

      frames += 1;
      if (frames < MAX_SETTLE_FRAMES) frame = requestAnimationFrame(check);
    };

    frame = requestAnimationFrame(check);

    return () => cancelAnimationFrame(frame);
  }, [axis, finishScroll, isOpen, overlayRef]);

  /*
   * While closed, watch the scroller each frame. Closing before any movement ends no scroll, so
   * there is no scroll-end to wait for, and the primitive can miss a partially visible sheet and
   * skip its exit scroll. A scroller that has stood still for a few frames with the panel still on
   * screen is carried to its closed marker; native snapping and motion do the rest.
   */
  useEffect(() => {
    if (isOpen) return;

    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    if (!scroller) return;

    let previous: number | undefined;
    let stationaryFrames = 0;
    let resumedExit = false;
    let exitedFrames = 0;
    let frame = 0;
    const checkExit = () => {
      finishScroll();
      if (latest.current.isOpen) return;

      const current = readSheetScroll(scroller, axis);

      stationaryFrames = current === previous ? stationaryFrames + 1 : 0;
      previous = current;

      if (reported.current === false && !isSheetPanelOnScreen(scroller)) {
        /*
         * The panel is off screen and still. On desktop Safari the primitive holds the overlay
         * until the scroller fires a scroll-end, which WebKit does not fire for an instant scroll
         * (a wheel that reaches the edge, a drag release written frame by frame), so the overlay
         * would stay mounted for good. The scroll is over: say so, now and then, until it unmounts.
         * This runs in every engine; elsewhere nothing waits for the event and it changes nothing.
         * A panel back on screen falls through to the carry below instead.
         */
        if (
          stationaryFrames >= STATIONARY_FRAMES &&
          (stationaryFrames - STATIONARY_FRAMES) % SCROLL_END_INTERVAL === 0
        ) {
          scroller.dispatchEvent(new Event("scrollend"));
        }
        exitedFrames += 1;
        if (exitedFrames < MAX_SETTLE_FRAMES) frame = requestAnimationFrame(checkExit);

        return;
      }

      if (stationaryFrames >= STATIONARY_FRAMES && !resumedExit) {
        const towardStart = bidirectional ? current <= getSheetViewportLength(axis) : after;
        const marker = towardStart ? scroller.firstElementChild : scroller.lastElementChild;

        if (marker instanceof HTMLElement) {
          resumedExit = true;
          scrollSheetTo(
            scroller,
            axis,
            snapScrollPosition(scroller, marker, axis, towardStart ? "start" : "end"),
            latest.current.reducedMotion,
          );
        }
      }
      frame = requestAnimationFrame(checkExit);
    };

    frame = requestAnimationFrame(checkExit);

    return () => cancelAnimationFrame(frame);
  }, [after, axis, bidirectional, finishScroll, isOpen, overlayRef]);

  /*
   * A scroll that ends, by the primitive's hand or by ours, settles the state. `scrollend` does not
   * bubble, but a capturing listener on the document hears it, and it can be attached in a layout
   * effect: the overlay's ref is not set yet when this component's layout effects run (it is an
   * ancestor's), so the scroller is looked up when the event arrives instead.
   */
  useSafeLayoutEffect(() => {
    const onScrollEnd = (event: Event) => {
      const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

      if (scroller && event.target === scroller) finishScroll();
    };

    document.addEventListener("scrollend", onScrollEnd, true);

    return () => document.removeEventListener("scrollend", onScrollEnd, true);
  }, [finishScroll, overlayRef]);

  /* Unmounting while closed ends the exit, whether or not a scroll-end was seen. */
  useEffect(
    () => () => {
      if (!latest.current.isOpen) notify(false);
    },
    [notify],
  );

  return null;
}

export {SheetLifecycle};

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

/*
 * What a sheet is doing is told by its scroller, not by a timer: the primitive animates by
 * scrolling, so an enter or exit is over when the scroll ends and the panel is where the open
 * state says it should be. This component renders nothing. It reports each settled state once to
 * `onAnimationEnd`, and carries a closed overlay's scroller to its closed position when the
 * primitive's own exit scroll did not run.
 */
function SheetLifecycle({
  onExitComplete,
  overlayRef,
  swipeDirection,
}: SheetRenderProps & {
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Called after the closed state has been reported. */
  onExitComplete?: () => void;
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

  /** The last state reported, so each settled state is announced once. */
  const reported = useRef<boolean | undefined>(undefined);
  /** True from a reopen of a retained overlay until its scroller is back at rest. */
  const restoring = useRef(false);
  /** Where the scroller last rested while open. */
  const restingScroll = useRef<number | null>(null);
  /** What the long-lived callbacks read, so a stale closure never reports an old state. */
  const latest = useRef({isOpen, onAnimationEnd, onExitComplete, reducedMotion});

  useSafeLayoutEffect(() => {
    if (isOpen !== latest.current.isOpen) {
      // A change of state supersedes whatever was reported for the previous one.
      if (isOpen) restoring.current = true;
      reported.current = undefined;
    }
    latest.current = {isOpen, onAnimationEnd, onExitComplete, reducedMotion};
  }, [isOpen, onAnimationEnd, onExitComplete, reducedMotion]);

  const notify = useCallback((open: boolean) => {
    if (reported.current === open) return;
    reported.current = open;
    if (open) restoring.current = false;
    latest.current.onAnimationEnd?.(open);
    if (!open) latest.current.onExitComplete?.();
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
   * Reopening while the overlay is still mounted from its exit: the primitive's enter runs once, on
   * mount, so a reopen has to carry the scroller back to rest here.
   */
  useEffect(() => {
    if (!isOpen || !restoring.current) return;

    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    if (scroller) {
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

        const align = initial
          ? after
            ? "start"
            : "end"
          : after && !bidirectional
            ? "end"
            : "start";

        restingScroll.current = snapScrollPosition(scroller, marker, axis, align);
      }

      if (Math.abs(readSheetScroll(scroller, axis) - restingScroll.current) > 1) {
        scrollSheetTo(scroller, axis, restingScroll.current, latest.current.reducedMotion);

        // The scroll's end reports the reopen.
        return;
      }
    }

    finishScroll();
  }, [after, axis, bidirectional, finishScroll, isOpen, overlayRef]);

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
    let frame = 0;
    const checkExit = () => {
      finishScroll();
      if (reported.current === false || latest.current.isOpen) return;

      const current = readSheetScroll(scroller, axis);

      stationaryFrames = current === previous ? stationaryFrames + 1 : 0;
      previous = current;

      if (stationaryFrames >= 2 && !resumedExit) {
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

  /* A scroll that ends, by the primitive's hand or by ours, settles the state. */
  useEffect(() => {
    const scroller = overlayRef.current ? findSheetScroller(overlayRef.current) : null;

    scroller?.addEventListener("scrollend", finishScroll);

    return () => {
      scroller?.removeEventListener("scrollend", finishScroll);
      // Unmounting while closed ends the exit, whether or not a scroll-end was seen.
      if (!latest.current.isOpen) notify(false);
    };
  }, [finishScroll, notify, overlayRef]);

  return null;
}

export {SheetLifecycle};

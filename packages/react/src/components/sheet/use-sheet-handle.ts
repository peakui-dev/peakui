"use client";

import type {SheetSnapPoint} from "./sheet.utils.ts";
import type {StringKey} from "../../i18n/strings.ts";
import type {HTMLAttributes, KeyboardEvent, RefObject} from "react";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {useLocalizedStringFormatter} from "@react-aria/i18n";
import {useCallback, useEffect, useRef, useState} from "react";
import {useLocale} from "react-aria-components/I18nProvider";

import {useMediaQuery} from "../../hooks/use-media-query.ts";
import {strings} from "../../i18n/strings.ts";

import {useSheetContext} from "./context.ts";
import {
  getSheetScroller,
  getSheetSnapTargets,
  readSheetScroll,
  scrollSheetTo,
} from "./sheet-scroll.ts";
import {isFullSize} from "./sheet.utils.ts";

/** A resting position of the sheet: where the scroller rests, and how much of the sheet shows. */
interface SheetRestingPosition {
  /** Percentage of the full extent that is revealed, above 0 and at most 100. */
  percent: number;
  /** The scroll position that reveals it. */
  scroll: number;
}

interface SheetPositions {
  /** The scroll distance of the full range: the farthest measured target. */
  extent: number;
  /** Resting positions, the least revealed first. */
  positions: SheetRestingPosition[];
}

/** Percentage under which two positions, or a position and the scroll, count as the same. */
const PERCENT_TOLERANCE = 0.5;

const UNIT_LENGTH = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[a-z]+|%)?$/i;
const CSS_FUNCTION = /^[a-z-]+\(.+\)$/i;

/**
 * Whether an authored snap point can describe a resting position at all. A number must be finite
 * and positive. A string must be a number with an optional unit and a positive value, or a CSS
 * function (`calc()`, `var()`, `min()`...), whose size only the browser knows: measurement drops
 * the ones that turn out to be zero or less. A full-size point is not a partial position: it is
 * the end every sheet already has, so it alone never makes the handle a slider. This is decided
 * from the authored points only, so server and client agree and the role never flips after
 * hydration.
 */
function isUsableSnapPoint(point: SheetSnapPoint): boolean {
  if (isFullSize(point)) return false;
  if (typeof point === "number") return Number.isFinite(point) && point > 0;
  if (typeof point !== "string") return false;

  const text = point.trim();

  return CSS_FUNCTION.test(text) || (UNIT_LENGTH.test(text) && parseFloat(text) > 0);
}

/**
 * Turns the scroller's measured snap targets into the positions a person can step between. The
 * extent is the farthest target. A target that reveals nothing (the closed position, or any layout
 * that measures as zero) and any non-finite one is dropped; the rest are sorted by the amount
 * revealed, and positions within the tolerance of each other collapse into one.
 *
 * `after` says the open end of the scroll range is its far end (bottom and right sheets); a top or
 * left sheet opens at scroll 0 and reveals more as it scrolls back toward it.
 */
function resolveSheetPositions(targets: readonly number[], after: boolean): SheetPositions {
  const finite = targets.filter((target) => Number.isFinite(target));
  const extent = finite.length > 0 ? Math.max(...finite) : 0;

  if (!(extent > 0)) return {extent: 0, positions: []};

  const sorted = finite
    .map((scroll) => ({percent: ((after ? scroll : extent - scroll) / extent) * 100, scroll}))
    .filter((position) => position.percent > 0)
    .sort((a, b) => a.percent - b.percent);

  return {
    extent,
    positions: sorted.filter(
      (position, index) =>
        index === 0 || position.percent - (sorted[index - 1]?.percent ?? 0) > PERCENT_TOLERANCE,
    ),
  };
}

/** The percentage of the extent revealed at a scroll position, or null when it cannot be told. */
function revealedPercent(scroll: number, extent: number, after: boolean): number | null {
  if (!(extent > 0) || !Number.isFinite(scroll)) return null;

  return ((after ? scroll : extent - scroll) / extent) * 100;
}

/** The slice of the string formatter the height text needs. */
type FormatSheetString = (key: StringKey, args?: Record<string, number | string>) => string;

/**
 * The spoken form of a revealed height, in the active locale; an `aria-valuetext` prop overrides
 * it.
 */
function describeSheetHeight(percent: number, format: FormatSheetString): string {
  switch (percent) {
    case 25:
      return format("heightQuarter");
    case 50:
      return format("heightHalf");
    case 75:
      return format("heightThreeQuarter");
    case 100:
      return format("heightFull");
    default:
      return format("heightPercent", {percent});
  }
}

interface SheetHandleValue {
  min: number;
  now: number;
}

interface UseSheetHandleResult {
  isSlider: boolean;
  ref: RefObject<HTMLDivElement | null>;
  sliderProps: HTMLAttributes<HTMLDivElement> | {"aria-hidden": true};
}

/*
 * The Handle's keyboard and screen reader surface. With no usable snap point the handle is only a
 * visual affordance (aria-hidden). With one it is a slider over the sheet's resting positions, and
 * this is the non-drag way to move between them (WCAG 2.2 SC 2.5.7): arrows step to the next
 * position, Home and End jump to the ends. It never dismisses: Escape and the close controls do.
 *
 * The scroller is the single source of truth, so the slider holds no position of its own: it reads
 * the scroll on `scroll` and re-measures the resting positions on `scrollend`.
 */
function useSheetHandle(swipeDirection: SheetRenderProps["swipeDirection"]): UseSheetHandleResult {
  const {snapPoints} = useSheetContext();
  const {direction} = useLocale();
  const formatter = useLocalizedStringFormatter(strings, "@peakui/react");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const ref = useRef<HTMLDivElement>(null);
  const measured = useRef<SheetPositions>({extent: 0, positions: []});
  const [value, setValue] = useState<SheetHandleValue | null>(null);

  const isSlider = (snapPoints ?? []).some(isUsableSnapPoint);
  const axis =
    swipeDirection === "left" || swipeDirection === "right" || swipeDirection === "horizontal"
      ? "x"
      : "y";
  // Whether the sheet's open position is at the far end of the scroll range.
  const after =
    swipeDirection === "bottom" ||
    swipeDirection === "right" ||
    swipeDirection === "horizontal" ||
    swipeDirection === "vertical";

  /** Reads the scroll into the slider's value; `remeasure` also re-reads the resting positions. */
  const sync = useCallback(
    (remeasure: boolean) => {
      const scroller = ref.current ? getSheetScroller(ref.current) : null;

      if (!scroller) return;

      if (remeasure) {
        measured.current = resolveSheetPositions(getSheetSnapTargets(scroller, axis), after);
      }

      const {extent, positions} = measured.current;
      const lowest = positions[0];
      const raw = revealedPercent(readSheetScroll(scroller, axis), extent, after);

      if (!lowest || raw === null) {
        setValue(null);

        return;
      }

      const min = Math.round(lowest.percent);
      const now = Math.round(Math.min(100, Math.max(lowest.percent, raw)));

      setValue((previous) =>
        previous && previous.min === min && previous.now === now ? previous : {min, now},
      );
    },
    [after, axis],
  );

  useEffect(() => {
    const scroller = ref.current ? getSheetScroller(ref.current) : null;

    if (!isSlider || !scroller) return;

    const onScroll = () => sync(false);
    const onScrollEnd = () => sync(true);

    // The scroller's layout exists only once the sheet is in the document, and reading it is
    // syncing with an external system, which is what this effect also subscribes to. A layout
    // effect would trip the same rule and add a blocking pass to every open for no gain: the
    // value is state the server cannot know, so the first paint is value-less either way.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    sync(true);
    scroller.addEventListener("scroll", onScroll, {passive: true});
    scroller.addEventListener("scrollend", onScrollEnd);

    return () => {
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", onScrollEnd);
    };
  }, [isSlider, sync]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // A consumer that already handled the key keeps it, and Alt/Ctrl/Meta chords (history
    // navigation, OS and browser shortcuts) are not ours. Shift is not a chord for a slider, so it
    // is ignored: Shift+Arrow steps like Arrow.
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;

    // On a horizontal sheet, reading order decides which arrow points toward more of the sheet.
    const flipped = axis === "x" && direction === "rtl";
    let move: "down" | "end" | "home" | "up";

    switch (event.key) {
      case "ArrowUp":
        move = "up";
        break;
      case "ArrowDown":
        move = "down";
        break;
      case "ArrowRight":
        move = flipped ? "down" : "up";
        break;
      case "ArrowLeft":
        move = flipped ? "up" : "down";
        break;
      case "Home":
        move = "home";
        break;
      case "End":
        move = "end";
        break;
      default:
        return;
    }

    const scroller = ref.current ? getSheetScroller(ref.current) : null;

    if (!scroller) return;

    // Prevented before the "nothing to do" returns on purpose: at either end the arrow is swallowed
    // rather than scrolling the page behind the sheet (slider convention).
    event.preventDefault();
    sync(true);

    const {extent, positions} = measured.current;
    const current = revealedPercent(readSheetScroll(scroller, axis), extent, after);
    const first = positions[0];
    const last = positions[positions.length - 1];

    if (!first || !last || current === null) return;

    let target: SheetRestingPosition | undefined;

    if (move === "home") target = first;
    else if (move === "end") target = last;
    else if (move === "up") target = positions.find((p) => p.percent > current + PERCENT_TOLERANCE);
    else target = positions.filter((p) => p.percent < current - PERCENT_TOLERANCE).pop();

    if (!target || Math.abs(target.percent - current) <= PERCENT_TOLERANCE) return;

    scrollSheetTo(scroller, axis, target.scroll, reducedMotion);
  };

  if (!isSlider) return {isSlider, ref, sliderProps: {"aria-hidden": true}};

  return {
    isSlider,
    ref,
    sliderProps: {
      "aria-label": formatter.format("resizeSheet"),
      "aria-orientation": axis === "x" ? "horizontal" : "vertical",
      "aria-valuemax": value ? 100 : undefined,
      "aria-valuemin": value?.min,
      "aria-valuenow": value?.now,
      "aria-valuetext": value
        ? describeSheetHeight(value.now, (key, args) => formatter.format(key, args))
        : undefined,
      onKeyDown,
      role: "slider",
      tabIndex: 0,
    },
  };
}

export {
  describeSheetHeight,
  isUsableSnapPoint,
  resolveSheetPositions,
  revealedPercent,
  useSheetHandle,
};
export type {SheetPositions, SheetRestingPosition};

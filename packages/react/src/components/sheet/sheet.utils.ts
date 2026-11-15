/** A snap point: a number (fraction of size when below 1, pixels otherwise) or a CSS length string. */
export type SheetSnapPoint = number | string;

type SheetSwipeDirection = "top" | "bottom" | "left" | "right" | "horizontal" | "vertical";

/** Release velocity (px/ms) above which a drag counts as a flick. */
export const HANDLE_DRAG_VELOCITY = 0.4;
/** Fraction of the visible size a sheet must be dragged to close without a flick. */
export const SHEET_CLOSE_THRESHOLD = 0.25;
/** Duration of the settle animation after release, in milliseconds. */
export const SHEET_RELEASE_MS = 500;

export function isFullSize(point: SheetSnapPoint) {
  return point === 1 || (typeof point === "string" && ["1", "100%"].includes(point.trim()));
}

/**
 * Cleans author-supplied snap points. Order is kept: the first point is where the sheet opens.
 * Invalid entries are dropped, and a trailing full-size point is implied by the sheet itself.
 */
export function normalizeSnapPoints(
  points?: readonly SheetSnapPoint[],
): SheetSnapPoint[] | undefined {
  if (!Array.isArray(points)) return undefined;

  const result: SheetSnapPoint[] = [];

  for (const point of points as readonly unknown[]) {
    if (typeof point === "number") {
      // A numeric 0 is a sheet of zero height, which is closed. Strings such as "0px" or "0%" are
      // kept as authored: the measured-geometry resolver drops anything that resolves to a size
      // of 0 or less, and any string it cannot parse.
      if (!Number.isFinite(point) || point <= 0) continue;
    } else if (typeof point === "string") {
      if (point.trim() === "") continue;
    } else {
      continue;
    }

    if (!result.includes(point)) result.push(point);
  }

  const last = result[result.length - 1];

  if (last !== undefined && isFullSize(last)) result.pop();

  return result.length > 0 ? result : undefined;
}

/** CSS cubic-bezier(0.32, 0.72, 0, 1) sampled over unit time. */
export function sheetReleaseEase(time: number) {
  if (!(time > 0)) return 0;
  if (time >= 1) return 1;

  // Solve x(s) = time with Newton's method, then read y(s).
  let solved = time;

  for (let iteration = 0; iteration < 8; iteration++) {
    const error = bezier(solved, 0.32, 0) - time;
    const slope = bezierSlope(solved, 0.32, 0);

    if (Math.abs(error) < 1e-4 || slope === 0) break;

    solved = Math.min(1, Math.max(0, solved - error / slope));
  }

  return bezier(solved, 0.72, 1);
}

function bezier(s: number, first: number, second: number) {
  const a = 1 - 3 * second + 3 * first;
  const b = 3 * second - 6 * first;
  const c = 3 * first;

  return ((a * s + b) * s + c) * s;
}

function bezierSlope(s: number, first: number, second: number) {
  const a = 1 - 3 * second + 3 * first;
  const b = 3 * second - 6 * first;
  const c = 3 * first;

  return 3 * a * s * s + 2 * b * s + c;
}

interface SheetDismissArgs {
  /** Current scroll position of the sheet. */
  current: number;
  /** Time of the gesture, in milliseconds. */
  elapsed: number;
  /** Scroll position at which the sheet is fully off the far edge. */
  extent: number;
  isDismissable: boolean;
  /** Scroll position the sheet settles at when not dismissed. */
  rest: number;
  /** Rendered size of the sheet along its axis. */
  size: number;
  swipeDirection: SheetSwipeDirection;
  /** Pointer travel along the axis; positive moves toward the scroll origin. */
  travel: number;
  viewport: number;
}

/** Decides where a released drag settles: the rest position, or the closed position. */
export function sheetDismissTarget({
  current,
  elapsed,
  extent,
  isDismissable,
  rest,
  size,
  swipeDirection,
  travel,
  viewport,
}: SheetDismissArgs) {
  const bidirectional = swipeDirection === "horizontal" || swipeDirection === "vertical";
  const towardStart = bidirectional
    ? travel > 0 || (travel === 0 && current < rest)
    : swipeDirection === "bottom" || swipeDirection === "right";
  const pointerDragged = towardStart ? travel : -travel;
  const scrollDragged = towardStart ? rest - current : current - rest;
  const dragged = Math.max(pointerDragged, scrollDragged);
  // Bottom and right sheets leave through scroll 0; top and left leave at the far edge.
  const closed = towardStart ? 0 : Math.max(0, extent);

  if (!isDismissable || !(dragged > 0)) return rest;

  const visible = size > 0 ? Math.min(size, viewport) : 0;
  const velocity = elapsed > 0 ? Math.abs(travel) / elapsed : 0;

  if (
    velocity > HANDLE_DRAG_VELOCITY ||
    (visible > 0 && dragged >= visible * SHEET_CLOSE_THRESHOLD)
  ) {
    return closed;
  }

  return rest;
}

/**
 * Picks the snap target a released drag settles on. A fast flick (|velocity| above the threshold)
 * moves to the next target in the flick direction: positive velocity toward lower values,
 * negative toward higher. Otherwise the nearest target wins.
 */
export function nearestSheetSnap(targets: number[], current: number, velocity: number) {
  const finite = targets.filter(Number.isFinite);

  if (finite.length === 0) return null;

  if (velocity > HANDLE_DRAG_VELOCITY) {
    const lower = finite.filter((target) => target < current - 0.5);

    if (lower.length > 0) return Math.max(...lower);
  }

  if (velocity < -HANDLE_DRAG_VELOCITY) {
    const higher = finite.filter((target) => target > current + 0.5);

    if (higher.length > 0) return Math.min(...higher);
  }

  return finite.reduce((best, target) =>
    Math.abs(target - current) < Math.abs(best - current) ? target : best,
  );
}

/** The parts of a key event that decide whether the browser scrolls for it. */
interface SheetScrollKey {
  altKey: boolean;
  ctrlKey: boolean;
  key: string;
  metaKey: boolean;
  shiftKey: boolean;
}

/**
 * The physical direction the browser scrolls for a key along the sheet's axis when nothing handles
 * it: -1 toward smaller coordinates (up, left), 1 toward larger (down, right), null when the key
 * does not scroll that axis. Alt, Ctrl and Meta chords are the browser's and the system's
 * (history, shortcuts), so they are never claimed.
 */
export function sheetScrollKeyDirection(event: SheetScrollKey, axis: "x" | "y"): -1 | 1 | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;

  if (axis === "x") {
    if (event.key === "ArrowLeft") return -1;
    if (event.key === "ArrowRight") return 1;

    return null;
  }

  switch (event.key) {
    case "ArrowUp":
    case "PageUp":
    case "Home":
      return -1;
    case "ArrowDown":
    case "PageDown":
    case "End":
      return 1;
    case " ":
      return event.shiftKey ? -1 : 1;
    default:
      return null;
  }
}

/** Animates a scalar from one value to another; returns a cancel function. */
export function animateSheetValue(
  from: number,
  to: number,
  update: (value: number) => void,
  complete: () => void,
  reducedMotion: boolean,
) {
  let cancelled = false;
  let frame = 0;
  const start = performance.now();
  const cancel = () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };

  if (reducedMotion || Math.abs(to - from) < 0.5) {
    update(to);
    complete();

    return cancel;
  }

  const step = (now: number) => {
    if (cancelled) return;

    const progress = Math.min(1, Math.max(0, (now - start) / SHEET_RELEASE_MS));

    update(from + (to - from) * sheetReleaseEase(progress));

    if (progress < 1) frame = requestAnimationFrame(step);
    else complete();
  };

  frame = requestAnimationFrame(step);

  return cancel;
}

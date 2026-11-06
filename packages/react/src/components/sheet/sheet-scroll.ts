/*
 * The Sheet's DOM adapter. The scroll-snap scroller is the only thing in a sheet that moves, so
 * this is the one file that measures it or scrolls it; the lifecycle and the handle drag read and
 * write positions through these functions and never touch the scroller's geometry themselves.
 */

type SheetAxis = "x" | "y";

/** The nearest scroller the primitive renders, from any element inside (or at) it. */
function getSheetScroller(from: Element): HTMLElement | null {
  return from.closest<HTMLElement>("[data-sheet-scroll]");
}

/** The scroller inside an overlay (or any ancestor of it): the reverse of `getSheetScroller`. */
function findSheetScroller(root: Element): HTMLElement | null {
  return root.querySelector<HTMLElement>("[data-sheet-scroll]");
}

/** Where the scroller is along its axis. */
function readSheetScroll(scroller: HTMLElement, axis: SheetAxis): number {
  return axis === "x" ? scroller.scrollLeft : scroller.scrollTop;
}

/** Moves the scroller along its axis at once, with no smooth scrolling (a drag follows the pointer). */
function writeSheetScroll(scroller: HTMLElement, axis: SheetAxis, position: number): void {
  if (axis === "x") scroller.scrollLeft = position;
  else scroller.scrollTop = position;
}

/**
 * The geometry a released drag is judged by: the scroll distance of the full range (`extent`), the
 * dialog's rendered length along the axis (`size`), and the viewport's (`viewport`).
 */
function measureSheet(
  scroller: HTMLElement,
  axis: SheetAxis,
): {extent: number; size: number; viewport: number} {
  const dialog = scroller.querySelector<HTMLElement>('[data-slot="sheet-dialog"]');
  const rect = dialog?.getBoundingClientRect();

  return axis === "y"
    ? {
        extent: scroller.scrollHeight - scroller.clientHeight,
        size: rect?.height || dialog?.clientHeight || 0,
        viewport: window.innerHeight,
      }
    : {
        extent: scroller.scrollWidth - scroller.clientWidth,
        size: rect?.width || dialog?.clientWidth || 0,
        viewport: window.innerWidth,
      };
}

/** The viewport's length along the scroller's axis. */
function getSheetViewportLength(axis: SheetAxis): number {
  return axis === "x" ? window.innerWidth : window.innerHeight;
}

/**
 * Whether any part of the dialog is inside the viewport. This is how a settled scroll is told
 * apart from one that stopped short: an exited sheet is entirely off screen.
 */
function isSheetPanelOnScreen(scroller: HTMLElement): boolean {
  const rect = scroller
    .querySelector<HTMLElement>('[data-slot="sheet-dialog"]')
    ?.getBoundingClientRect();

  return (
    !!rect &&
    rect.bottom > 0 &&
    rect.top < window.innerHeight &&
    rect.right > 0 &&
    rect.left < window.innerWidth
  );
}

/**
 * The scroll position at which `marker` meets the scroller's edge. `align` is a `scroll-snap-align`
 * value; only its first keyword counts, and anything but `end` is read as `start`. The marker's
 * `scroll-margin` is honoured, as the browser's own snapping does.
 */
function snapScrollPosition(
  scroller: HTMLElement,
  marker: HTMLElement,
  axis: SheetAxis,
  align: string,
): number {
  const markerRect = marker.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const style = getComputedStyle(marker);
  const edge = align.trim().split(/\s+/)[0];

  if (axis === "y") {
    if (edge === "end") {
      const margin = parseFloat(style.scrollMarginBottom) || 0;

      return (
        markerRect.bottom - scrollerRect.top + scroller.scrollTop + margin - scroller.clientHeight
      );
    }

    const margin = parseFloat(style.scrollMarginTop) || 0;

    return markerRect.top - scrollerRect.top + scroller.scrollTop - margin;
  }

  if (edge === "end") {
    const margin = parseFloat(style.scrollMarginRight) || 0;

    return (
      markerRect.right - scrollerRect.left + scroller.scrollLeft + margin - scroller.clientWidth
    );
  }

  const margin = parseFloat(style.scrollMarginLeft) || 0;

  return markerRect.left - scrollerRect.left + scroller.scrollLeft - margin;
}

/**
 * Every scroll position the scroller can rest at: one per descendant that declares a
 * `scroll-snap-align`. Ascending, with positions within half a pixel counted once.
 */
function getSheetSnapTargets(scroller: HTMLElement, axis: SheetAxis): number[] {
  const targets: number[] = [];

  for (const node of scroller.querySelectorAll<HTMLElement>("*")) {
    const align = node.style.scrollSnapAlign || getComputedStyle(node).scrollSnapAlign;

    if (!align || align.startsWith("none")) continue;

    const position = snapScrollPosition(scroller, node, axis, align);

    if (Number.isFinite(position)) targets.push(position);
  }

  targets.sort((a, b) => a - b);

  return targets.filter((target, index) => index === 0 || target - (targets[index - 1] ?? 0) > 0.5);
}

/**
 * Scrolls the scroller along its axis. Under reduced motion the scroll jumps (`auto`, which follows
 * the element's own `scroll-behavior`, rather than forcing an instant jump); otherwise it glides.
 */
function scrollSheetTo(
  scroller: HTMLElement,
  axis: SheetAxis,
  position: number,
  reducedMotion: boolean,
): void {
  const behavior = reducedMotion ? "auto" : "smooth";

  scroller.scrollTo(axis === "y" ? {behavior, top: position} : {behavior, left: position});
}

export {
  findSheetScroller,
  getSheetScroller,
  getSheetSnapTargets,
  getSheetViewportLength,
  isSheetPanelOnScreen,
  measureSheet,
  readSheetScroll,
  scrollSheetTo,
  snapScrollPosition,
  writeSheetScroll,
};

export type {SheetAxis};

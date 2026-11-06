"use client";

import type {RefObject} from "react";

import {useCallback, useMemo, useRef, useState} from "react";

interface ContextMenuAnchorPoint {
  x: number;
  y: number;
}

interface ContextMenuAnchor {
  /** The hidden fixed element the popover positions against. */
  ref: RefObject<HTMLDivElement | null>;
  /** Viewport coordinates of the anchor, or null before the first open. */
  point: ContextMenuAnchorPoint | null;
  /** Anchors at a pointer position (viewport coordinates). */
  setPoint(x: number, y: number): void;
  /** Anchors at the bottom-start corner of an element, for keyboard opens. */
  setFromElement(el: Element): void;
}

/*
 * RAC has no virtual anchor, so the menu is positioned against a real zero-size element whose
 * inline left/top this hook owns. The element itself is rendered by ContextMenu.Trigger.
 */
function useContextMenuAnchor(): ContextMenuAnchor {
  const ref = useRef<HTMLDivElement | null>(null);
  const [point, setPointState] = useState<ContextMenuAnchorPoint | null>(null);

  const setPoint = useCallback((x: number, y: number) => {
    setPointState({x, y});
  }, []);

  const setFromElement = useCallback((el: Element) => {
    const rect = el.getBoundingClientRect();

    setPointState({x: rect.left, y: rect.bottom});
  }, []);

  return useMemo(() => ({point, ref, setFromElement, setPoint}), [point, setFromElement, setPoint]);
}

export {useContextMenuAnchor};

export type {ContextMenuAnchor, ContextMenuAnchorPoint};

"use client";

import type {SheetSnapPoint} from "./sheet.utils.ts";
import type {EdgePlacement} from "../../utils/overlay.ts";
import type {SheetRenderProps} from "react-aria-components/Sheet";

import {createContext, use} from "react";

/** What the parts of one Sheet share. Provided by the root, read through `useSheetContext`. */
interface SheetContextValue {
  closeSheet: () => void;
  isDetached: boolean;
  isDismissable: boolean;
  isNested: boolean;
  isOpen: boolean;
  /** True when a `Sheet.Trigger` is present: the trigger then owns the open state for RAC. */
  isTriggerControlled: boolean;
  onAnimationEnd?: (open: boolean) => void;
  placement: EdgePlacement;
  setIsOpen: (open: boolean) => void;
  snapPoints?: SheetSnapPoint[];
}

const SheetContext = createContext<SheetContextValue | null>(null);

/** The swipe direction RAC resolved for the overlay (it may be bidirectional), for the Handle. */
const SheetSwipeDirectionContext = createContext<SheetRenderProps["swipeDirection"] | null>(null);

/*
 * Whether the overlay is playing its exit. The primitive's overlay and backdrop layer report it, but
 * its dialog part reports neither a render prop nor `data-exiting`, so the Backdrop carries it down.
 */
const SheetExitingContext = createContext(false);

function useSheetContext(): SheetContextValue {
  const context = use(SheetContext);

  if (!context) {
    throw new Error("useSheetContext must be used within a Sheet");
  }

  return context;
}

export {SheetContext, SheetExitingContext, SheetSwipeDirectionContext, useSheetContext};

export type {SheetContextValue};

"use client";

import type {RefObject} from "react";

import {createContext, use} from "react";

/* -------------------------------------------------------------------------------------------------
 * YearPickerContext
 *
 * Provided by Calendar (and RangeCalendar) to control the year picker's visibility. The picker's
 * parts read it to open and close the picker, so the host's public API stays free of wrappers.
 * -----------------------------------------------------------------------------------------------*/
interface YearPickerContextValue {
  /** `data-slot` of the host's day grid, which the year grid is laid over. */
  calendarGridSlot: "calendar-grid" | "range-calendar-grid";
  calendarRef: RefObject<HTMLDivElement | null>;
  isYearPickerOpen: boolean;
  setIsYearPickerOpen: (open: boolean) => void;
}

const YearPickerContext = createContext<YearPickerContextValue | null>(null);

/** Reads YearPickerContext. Throws outside a Calendar or RangeCalendar. */
function useYearPicker(): YearPickerContextValue {
  const context = use(YearPickerContext);

  if (!context) {
    throw new Error("useYearPicker must be used within a <Calendar> or <RangeCalendar> component.");
  }

  return context;
}

export {YearPickerContext, useYearPicker};
export type {YearPickerContextValue};

import type {ComponentProps} from "react";

import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "./calendar-year-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 *
 * No Root: the year picker is a set of parts that Calendar and RangeCalendar host, so the
 * namespace is a plain object of those parts.
 * -----------------------------------------------------------------------------------------------*/
export const CalendarYearPicker = {
  Cell: CalendarYearPickerCell,
  Grid: CalendarYearPickerGrid,
  GridBody: CalendarYearPickerGridBody,
  Trigger: CalendarYearPickerTrigger,
  TriggerHeading: CalendarYearPickerTriggerHeading,
  TriggerIndicator: CalendarYearPickerTriggerIndicator,
};

export type CalendarYearPicker = {
  CellProps: ComponentProps<typeof CalendarYearPickerCell>;
  GridBodyProps: ComponentProps<typeof CalendarYearPickerGridBody>;
  GridProps: ComponentProps<typeof CalendarYearPickerGrid>;
  TriggerHeadingProps: ComponentProps<typeof CalendarYearPickerTriggerHeading>;
  TriggerIndicatorProps: ComponentProps<typeof CalendarYearPickerTriggerIndicator>;
  TriggerProps: ComponentProps<typeof CalendarYearPickerTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
};

export type {
  CalendarYearPickerCellProps,
  CalendarYearPickerCellRenderProps,
  CalendarYearPickerGridBodyProps,
  CalendarYearPickerGridProps,
  CalendarYearPickerTriggerHeadingProps,
  CalendarYearPickerTriggerIndicatorProps,
  CalendarYearPickerTriggerProps,
  CalendarYearPickerTriggerRenderProps,
} from "./calendar-year-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Host contract: what Calendar and RangeCalendar provide and the parts read
 * -----------------------------------------------------------------------------------------------*/
export {YearPickerContext, useYearPicker} from "./year-picker-context.ts";
export type {YearPickerContextValue} from "./year-picker-context.ts";
export {useCalendarOrRangeState} from "./use-calendar-state.ts";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {calendarYearPickerVariants} from "@peakui/styles";

export type {CalendarYearPickerVariants} from "@peakui/styles";

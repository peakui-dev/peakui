import type {RangeCalendarRootProps} from "./range-calendar.tsx";
import type {ComponentProps, ReactElement} from "react";
import type {DateValue} from "react-aria-components/RangeCalendar";

import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker/index.ts";

import {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendarRoot,
} from "./range-calendar.tsx";

/*
 * The root is generic over the value type, and Object.assign erases a generic signature, so the
 * compound is cast back to one.
 */
type RangeCalendarComponent = <T extends DateValue = DateValue>(
  props: RangeCalendarRootProps<T>,
) => ReactElement | null;

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
const RangeCalendarCompound = Object.assign(RangeCalendarRoot, {
  Cell: RangeCalendarCell,
  CellIndicator: RangeCalendarCellIndicator,
  Grid: RangeCalendarGrid,
  GridBody: RangeCalendarGridBody,
  GridHeader: RangeCalendarGridHeader,
  Header: RangeCalendarHeader,
  HeaderCell: RangeCalendarHeaderCell,
  Heading: RangeCalendarHeading,
  NavButton: RangeCalendarNavButton,
  Root: RangeCalendarRoot,
  YearPickerCell: CalendarYearPickerCell,
  YearPickerGrid: CalendarYearPickerGrid,
  YearPickerGridBody: CalendarYearPickerGridBody,
  YearPickerTrigger: CalendarYearPickerTrigger,
  YearPickerTriggerHeading: CalendarYearPickerTriggerHeading,
  YearPickerTriggerIndicator: CalendarYearPickerTriggerIndicator,
});

export const RangeCalendar = RangeCalendarCompound as RangeCalendarComponent &
  typeof RangeCalendarCompound;

export type RangeCalendar = {
  CellIndicatorProps: ComponentProps<typeof RangeCalendarCellIndicator>;
  CellProps: ComponentProps<typeof RangeCalendarCell>;
  GridBodyProps: ComponentProps<typeof RangeCalendarGridBody>;
  GridHeaderProps: ComponentProps<typeof RangeCalendarGridHeader>;
  GridProps: ComponentProps<typeof RangeCalendarGrid>;
  HeaderCellProps: ComponentProps<typeof RangeCalendarHeaderCell>;
  HeaderProps: ComponentProps<typeof RangeCalendarHeader>;
  HeadingProps: ComponentProps<typeof RangeCalendarHeading>;
  NavButtonProps: ComponentProps<typeof RangeCalendarNavButton>;
  Props: ComponentProps<typeof RangeCalendarRoot>;
  RootProps: ComponentProps<typeof RangeCalendarRoot>;
  YearPickerCellProps: ComponentProps<typeof CalendarYearPickerCell>;
  YearPickerGridBodyProps: ComponentProps<typeof CalendarYearPickerGridBody>;
  YearPickerGridProps: ComponentProps<typeof CalendarYearPickerGrid>;
  YearPickerTriggerHeadingProps: ComponentProps<typeof CalendarYearPickerTriggerHeading>;
  YearPickerTriggerIndicatorProps: ComponentProps<typeof CalendarYearPickerTriggerIndicator>;
  YearPickerTriggerProps: ComponentProps<typeof CalendarYearPickerTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  RangeCalendarCell,
  RangeCalendarCellIndicator,
  RangeCalendarGrid,
  RangeCalendarGridBody,
  RangeCalendarGridHeader,
  RangeCalendarHeader,
  RangeCalendarHeaderCell,
  RangeCalendarHeading,
  RangeCalendarNavButton,
  RangeCalendarRoot,
};

export type {
  RangeCalendarCellIndicatorProps,
  RangeCalendarCellProps,
  RangeCalendarGridBodyProps,
  RangeCalendarGridHeaderProps,
  RangeCalendarGridProps,
  RangeCalendarHeaderCellProps,
  RangeCalendarHeaderProps,
  RangeCalendarHeadingProps,
  RangeCalendarNavButtonProps,
  RangeCalendarRootProps,
  RangeCalendarRootProps as RangeCalendarProps,
} from "./range-calendar.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {rangeCalendarVariants} from "@peakui/styles";

export type {RangeCalendarVariants} from "@peakui/styles";

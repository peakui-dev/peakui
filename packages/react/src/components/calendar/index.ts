import type {CalendarRootProps} from "./calendar.tsx";
import type {ComponentProps, ReactElement} from "react";
import type {CalendarSelectionMode, DateValue} from "react-aria-components/Calendar";

import {
  CalendarYearPickerCell,
  CalendarYearPickerGrid,
  CalendarYearPickerGridBody,
  CalendarYearPickerTrigger,
  CalendarYearPickerTriggerHeading,
  CalendarYearPickerTriggerIndicator,
} from "../calendar-year-picker/index.ts";

import {
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
} from "./calendar.tsx";

/*
 * The root is generic over the value type and the selection mode, and Object.assign erases a
 * generic signature, so the compound is cast back to one.
 */
type CalendarComponent = <
  T extends DateValue = DateValue,
  M extends CalendarSelectionMode = "single",
>(
  props: CalendarRootProps<T, M>,
) => ReactElement | null;

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
const CalendarCompound = Object.assign(CalendarRoot, {
  Cell: CalendarCell,
  CellIndicator: CalendarCellIndicator,
  Grid: CalendarGrid,
  GridBody: CalendarGridBody,
  GridHeader: CalendarGridHeader,
  Header: CalendarHeader,
  HeaderCell: CalendarHeaderCell,
  Heading: CalendarHeading,
  NavButton: CalendarNavButton,
  Root: CalendarRoot,
  YearPickerCell: CalendarYearPickerCell,
  YearPickerGrid: CalendarYearPickerGrid,
  YearPickerGridBody: CalendarYearPickerGridBody,
  YearPickerTrigger: CalendarYearPickerTrigger,
  YearPickerTriggerHeading: CalendarYearPickerTriggerHeading,
  YearPickerTriggerIndicator: CalendarYearPickerTriggerIndicator,
});

export const Calendar = CalendarCompound as CalendarComponent & typeof CalendarCompound;

export type Calendar = {
  CellIndicatorProps: ComponentProps<typeof CalendarCellIndicator>;
  CellProps: ComponentProps<typeof CalendarCell>;
  GridBodyProps: ComponentProps<typeof CalendarGridBody>;
  GridHeaderProps: ComponentProps<typeof CalendarGridHeader>;
  GridProps: ComponentProps<typeof CalendarGrid>;
  HeaderCellProps: ComponentProps<typeof CalendarHeaderCell>;
  HeaderProps: ComponentProps<typeof CalendarHeader>;
  HeadingProps: ComponentProps<typeof CalendarHeading>;
  NavButtonProps: ComponentProps<typeof CalendarNavButton>;
  Props: ComponentProps<typeof CalendarRoot>;
  RootProps: ComponentProps<typeof CalendarRoot>;
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
  CalendarCell,
  CalendarCellIndicator,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeader,
  CalendarHeaderCell,
  CalendarHeading,
  CalendarNavButton,
  CalendarRoot,
};

export type {
  CalendarCellIndicatorProps,
  CalendarCellProps,
  CalendarGridBodyProps,
  CalendarGridHeaderProps,
  CalendarGridProps,
  CalendarHeaderCellProps,
  CalendarHeaderProps,
  CalendarHeadingProps,
  CalendarNavButtonProps,
  CalendarRootProps,
  CalendarRootProps as CalendarProps,
} from "./calendar.tsx";

export type {CalendarSelectionMode} from "react-aria-components/Calendar";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {calendarVariants} from "@peakui/styles";

export type {CalendarVariants} from "@peakui/styles";

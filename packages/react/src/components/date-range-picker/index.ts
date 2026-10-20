import type {ComponentProps} from "react";

import {
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
} from "./date-range-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DateRangePicker = Object.assign(DateRangePickerRoot, {
  Popover: DateRangePickerPopover,
  RangeSeparator: DateRangePickerRangeSeparator,
  Root: DateRangePickerRoot,
  Trigger: DateRangePickerTrigger,
  TriggerIndicator: DateRangePickerTriggerIndicator,
});

export type DateRangePicker = {
  PopoverProps: ComponentProps<typeof DateRangePickerPopover>;
  Props: ComponentProps<typeof DateRangePickerRoot>;
  RangeSeparatorProps: ComponentProps<typeof DateRangePickerRangeSeparator>;
  RootProps: ComponentProps<typeof DateRangePickerRoot>;
  TriggerIndicatorProps: ComponentProps<typeof DateRangePickerTriggerIndicator>;
  TriggerProps: ComponentProps<typeof DateRangePickerTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  DateRangePickerPopover,
  DateRangePickerRangeSeparator,
  DateRangePickerRoot,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
};

export type {
  DateRangePickerPopoverProps,
  DateRangePickerRootProps,
  DateRangePickerRangeSeparatorProps,
  DateRangePickerRootProps as DateRangePickerProps,
  DateRangePickerTriggerIndicatorProps,
  DateRangePickerTriggerProps,
} from "./date-range-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateRangePickerVariants} from "@peakui/styles";

export type {DateRangePickerVariants} from "@peakui/styles";

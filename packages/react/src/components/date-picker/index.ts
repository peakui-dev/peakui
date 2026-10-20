import type {ComponentProps} from "react";

import {
  DatePickerPopover,
  DatePickerRoot,
  DatePickerTrigger,
  DatePickerTriggerIndicator,
} from "./date-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DatePicker = Object.assign(DatePickerRoot, {
  Popover: DatePickerPopover,
  Root: DatePickerRoot,
  Trigger: DatePickerTrigger,
  TriggerIndicator: DatePickerTriggerIndicator,
});

export type DatePicker = {
  PopoverProps: ComponentProps<typeof DatePickerPopover>;
  Props: ComponentProps<typeof DatePickerRoot>;
  RootProps: ComponentProps<typeof DatePickerRoot>;
  TriggerIndicatorProps: ComponentProps<typeof DatePickerTriggerIndicator>;
  TriggerProps: ComponentProps<typeof DatePickerTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {DatePickerPopover, DatePickerRoot, DatePickerTrigger, DatePickerTriggerIndicator};

export type {
  DatePickerPopoverProps,
  DatePickerRootProps,
  DatePickerRootProps as DatePickerProps,
  DatePickerTriggerIndicatorProps,
  DatePickerTriggerProps,
} from "./date-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {datePickerVariants} from "@peakui/styles";

export type {DatePickerVariants} from "@peakui/styles";

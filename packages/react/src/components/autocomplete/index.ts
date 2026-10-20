import type {ComponentProps} from "react";

import {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
} from "./autocomplete.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Autocomplete = Object.assign(AutocompleteRoot, {
  Root: AutocompleteRoot,
  Trigger: AutocompleteTrigger,
  Value: AutocompleteValue,
  Indicator: AutocompleteIndicator,
  ClearButton: AutocompleteClearButton,
  Popover: AutocompletePopover,
  Filter: AutocompleteFilter,
});

export type Autocomplete<T extends object = object, M extends "single" | "multiple" = "single"> = {
  Props: ComponentProps<typeof AutocompleteRoot<T, M>>;
  RootProps: ComponentProps<typeof AutocompleteRoot<T, M>>;
  TriggerProps: ComponentProps<typeof AutocompleteTrigger>;
  ValueProps: ComponentProps<typeof AutocompleteValue>;
  IndicatorProps: ComponentProps<typeof AutocompleteIndicator>;
  ClearButtonProps: ComponentProps<typeof AutocompleteClearButton>;
  PopoverProps: ComponentProps<typeof AutocompletePopover>;
  FilterProps: ComponentProps<typeof AutocompleteFilter>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  AutocompleteClearButton,
  AutocompleteFilter,
  AutocompleteIndicator,
  AutocompletePopover,
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
};

export type {
  AutocompleteRootProps,
  AutocompleteRootProps as AutocompleteProps,
  AutocompleteTriggerProps,
  AutocompleteValueProps,
  AutocompleteIndicatorProps,
  AutocompleteClearButtonProps,
  AutocompletePopoverProps,
  AutocompleteFilterProps,
} from "./autocomplete.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {autocompleteVariants} from "@peakui/styles";

export type {AutocompleteVariants} from "@peakui/styles";

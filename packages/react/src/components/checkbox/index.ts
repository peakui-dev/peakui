import type {ComponentProps} from "react";

import {CheckboxContent, CheckboxControl, CheckboxIndicator, CheckboxRoot} from "./checkbox.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Checkbox = Object.assign(CheckboxRoot, {
  Root: CheckboxRoot,
  Content: CheckboxContent,
  Control: CheckboxControl,
  Indicator: CheckboxIndicator,
});

export type Checkbox = {
  Props: ComponentProps<typeof CheckboxRoot>;
  RootProps: ComponentProps<typeof CheckboxRoot>;
  ContentProps: ComponentProps<typeof CheckboxContent>;
  ControlProps: ComponentProps<typeof CheckboxControl>;
  IndicatorProps: ComponentProps<typeof CheckboxIndicator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxContent, CheckboxControl, CheckboxIndicator, CheckboxRoot};

export type {
  CheckboxRootProps,
  CheckboxRootProps as CheckboxProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxFieldRenderProps,
  CheckboxButtonRenderProps,
} from "./checkbox.tsx";

/* -------------------------------------------------------------------------------------------------
 * Group
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxGroup} from "../checkbox-group/index.ts";
export type {CheckboxGroupProps} from "../checkbox-group/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {checkboxVariants} from "@peakui/styles";

export type {CheckboxVariants} from "@peakui/styles";

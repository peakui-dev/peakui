import type {ComponentProps} from "react";

import {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
} from "./number-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const NumberField = Object.assign(NumberFieldRoot, {
  Root: NumberFieldRoot,
  Group: NumberFieldGroup,
  Input: NumberFieldInput,
  IncrementButton: NumberFieldIncrementButton,
  DecrementButton: NumberFieldDecrementButton,
});

export type NumberField = {
  Props: ComponentProps<typeof NumberFieldRoot>;
  RootProps: ComponentProps<typeof NumberFieldRoot>;
  GroupProps: ComponentProps<typeof NumberFieldGroup>;
  InputProps: ComponentProps<typeof NumberFieldInput>;
  IncrementButtonProps: ComponentProps<typeof NumberFieldIncrementButton>;
  DecrementButtonProps: ComponentProps<typeof NumberFieldDecrementButton>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
};

export type {
  NumberFieldRootProps,
  NumberFieldRootProps as NumberFieldProps,
} from "./number-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {numberFieldVariants} from "@peakui/styles";

export type {NumberFieldVariants} from "@peakui/styles";

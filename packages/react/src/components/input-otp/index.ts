import type {ComponentProps} from "react";

import {InputOtpGroup, InputOtpRoot, InputOtpSeparator, InputOtpSlot} from "./input-otp.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const InputOtp = Object.assign(InputOtpRoot, {
  Root: InputOtpRoot,
  Group: InputOtpGroup,
  Slot: InputOtpSlot,
  Separator: InputOtpSeparator,
});

export type InputOtp = {
  Props: ComponentProps<typeof InputOtpRoot>;
  RootProps: ComponentProps<typeof InputOtpRoot>;
  GroupProps: ComponentProps<typeof InputOtpGroup>;
  SlotProps: ComponentProps<typeof InputOtpSlot>;
  SeparatorProps: ComponentProps<typeof InputOtpSeparator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {InputOtpGroup, InputOtpRoot, InputOtpSeparator, InputOtpSlot};

export type {
  InputOtpGroupProps,
  InputOtpRootProps,
  InputOtpRootProps as InputOtpProps,
  InputOtpSeparatorProps,
  InputOtpSlotProps,
} from "./input-otp.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inputOtpVariants} from "@peakui/styles";

export type {InputOtpVariants} from "@peakui/styles";

/* -------------------------------------------------------------------------------------------------
 * Regular Expressions
 * -----------------------------------------------------------------------------------------------*/
export const REGEXP_ONLY_DIGITS = "^\\d+$";
export const REGEXP_ONLY_CHARS = "^[a-zA-Z]+$";
export const REGEXP_ONLY_DIGITS_AND_CHARS = "^[a-zA-Z0-9]+$";

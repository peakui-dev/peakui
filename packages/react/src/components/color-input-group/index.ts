import type {ComponentProps} from "react";

import {
  ColorInputGroupInput,
  ColorInputGroupPrefix,
  ColorInputGroupRoot,
  ColorInputGroupSuffix,
} from "./color-input-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorInputGroup = Object.assign(ColorInputGroupRoot, {
  Input: ColorInputGroupInput,
  Prefix: ColorInputGroupPrefix,
  Root: ColorInputGroupRoot,
  Suffix: ColorInputGroupSuffix,
});

export type ColorInputGroup = {
  InputProps: ComponentProps<typeof ColorInputGroupInput>;
  PrefixProps: ComponentProps<typeof ColorInputGroupPrefix>;
  Props: ComponentProps<typeof ColorInputGroupRoot>;
  RootProps: ComponentProps<typeof ColorInputGroupRoot>;
  SuffixProps: ComponentProps<typeof ColorInputGroupSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ColorInputGroupInput, ColorInputGroupPrefix, ColorInputGroupRoot, ColorInputGroupSuffix};

export type {
  ColorInputGroupInputProps,
  ColorInputGroupPrefixProps,
  ColorInputGroupRootProps,
  ColorInputGroupRootProps as ColorInputGroupProps,
  ColorInputGroupSuffixProps,
} from "./color-input-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorInputGroupVariants} from "@peakui/styles";

export type {ColorInputGroupVariants} from "@peakui/styles";

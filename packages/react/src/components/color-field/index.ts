import type {ComponentProps} from "react";

import {ColorFieldRoot} from "./color-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorField = Object.assign(ColorFieldRoot, {
  Root: ColorFieldRoot,
});

export type ColorField = {
  Props: ComponentProps<typeof ColorFieldRoot>;
  RootProps: ComponentProps<typeof ColorFieldRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ColorFieldRoot};

export type {
  ColorFieldRootProps,
  ColorFieldRootProps as ColorFieldProps,
  ColorValue,
} from "./color-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorFieldVariants} from "@peakui/styles";

export type {ColorFieldVariants} from "@peakui/styles";

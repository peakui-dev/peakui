import type {ComponentProps} from "react";

import {ColorSwatchRoot} from "./color-swatch.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSwatch = Object.assign(ColorSwatchRoot, {
  Root: ColorSwatchRoot,
});

export type ColorSwatch = {
  Props: ComponentProps<typeof ColorSwatchRoot>;
  RootProps: ComponentProps<typeof ColorSwatchRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ColorSwatchRoot};

export type {
  ColorSwatchRootProps,
  ColorSwatchRootProps as ColorSwatchProps,
} from "./color-swatch.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorSwatchVariants} from "@peakui/styles";

export type {ColorSwatchVariants} from "@peakui/styles";

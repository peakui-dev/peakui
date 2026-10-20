import type {ComponentProps} from "react";

import {ColorAreaRoot, ColorAreaThumb} from "./color-area.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorArea = Object.assign(ColorAreaRoot, {
  Root: ColorAreaRoot,
  Thumb: ColorAreaThumb,
});

export type ColorArea = {
  Props: ComponentProps<typeof ColorAreaRoot>;
  RootProps: ComponentProps<typeof ColorAreaRoot>;
  ThumbProps: ComponentProps<typeof ColorAreaThumb>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ColorAreaRoot, ColorAreaThumb};

export type {
  ColorAreaRootProps,
  ColorAreaRootProps as ColorAreaProps,
  ColorAreaThumbProps,
} from "./color-area.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorAreaVariants} from "@peakui/styles";

export type {ColorAreaVariants} from "@peakui/styles";

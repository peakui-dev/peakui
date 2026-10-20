import type {ComponentProps} from "react";

import {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
} from "./color-swatch-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSwatchPicker = Object.assign(ColorSwatchPickerRoot, {
  Indicator: ColorSwatchPickerIndicator,
  Item: ColorSwatchPickerItem,
  Root: ColorSwatchPickerRoot,
  Swatch: ColorSwatchPickerSwatch,
});

export type ColorSwatchPicker = {
  IndicatorProps: ComponentProps<typeof ColorSwatchPickerIndicator>;
  ItemProps: ComponentProps<typeof ColorSwatchPickerItem>;
  Props: ComponentProps<typeof ColorSwatchPickerRoot>;
  RootProps: ComponentProps<typeof ColorSwatchPickerRoot>;
  SwatchProps: ComponentProps<typeof ColorSwatchPickerSwatch>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
};

export type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerRootProps,
  ColorSwatchPickerRootProps as ColorSwatchPickerProps,
  ColorSwatchPickerSwatchProps,
} from "./color-swatch-picker.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorSwatchPickerVariants} from "@peakui/styles";

export type {ColorSwatchPickerVariants} from "@peakui/styles";

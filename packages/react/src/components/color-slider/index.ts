import type {ComponentProps} from "react";

import {
  ColorSliderOutput,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
} from "./color-slider.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ColorSlider = Object.assign(ColorSliderRoot, {
  Output: ColorSliderOutput,
  Root: ColorSliderRoot,
  Thumb: ColorSliderThumb,
  Track: ColorSliderTrack,
});

export type ColorSlider = {
  OutputProps: ComponentProps<typeof ColorSliderOutput>;
  Props: ComponentProps<typeof ColorSliderRoot>;
  RootProps: ComponentProps<typeof ColorSliderRoot>;
  ThumbProps: ComponentProps<typeof ColorSliderThumb>;
  TrackProps: ComponentProps<typeof ColorSliderTrack>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ColorSliderOutput, ColorSliderRoot, ColorSliderThumb, ColorSliderTrack};

export type {
  AlphaChannel,
  ColorSliderChannelProps,
  ColorSliderOutputProps,
  ColorSliderRootProps,
  ColorSliderRootProps as ColorSliderProps,
  ColorSliderThumbProps,
  ColorSliderTrackProps,
  HSBChannel,
  HSLChannel,
  HSLHSBSharedChannel,
  RGBChannel,
} from "./color-slider.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {colorSliderVariants} from "@peakui/styles";

export type {ColorSliderVariants} from "@peakui/styles";

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/color-slider.css. */
export const colorSliderVariants = tv({
  slots: {
    base: "color-slider",
    output: "color-slider__output",
    thumb: "color-slider__thumb",
    track: "color-slider__track",
  },
});

export type ColorSliderVariants = VariantProps<typeof colorSliderVariants>;

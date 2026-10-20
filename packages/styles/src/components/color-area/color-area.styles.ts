import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/color-area.css. */
export const colorAreaVariants = tv({
  defaultVariants: {
    showDots: false,
  },
  slots: {
    base: "color-area",
    thumb: "color-area__thumb",
  },
  variants: {
    showDots: {
      false: {},
      true: {
        base: "color-area--show-dots",
      },
    },
  },
});

export type ColorAreaVariants = VariantProps<typeof colorAreaVariants>;

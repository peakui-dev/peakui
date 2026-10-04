import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/surface.css. */
export const surfaceVariants = tv({
  base: "surface",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "surface--default",
      secondary: "surface--secondary",
      tertiary: "surface--tertiary",
      transparent: "surface--transparent",
    },
  },
});

export type SurfaceVariants = VariantProps<typeof surfaceVariants>;

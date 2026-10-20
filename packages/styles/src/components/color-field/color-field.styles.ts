import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/color-field.css. */
export const colorFieldVariants = tv({
  base: "color-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "color-field--full-width",
    },
  },
});

export type ColorFieldVariants = VariantProps<typeof colorFieldVariants>;

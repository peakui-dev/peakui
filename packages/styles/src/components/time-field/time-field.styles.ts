import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/time-field.css. */
export const timeFieldVariants = tv({
  base: "time-field",
  defaultVariants: {
    fullWidth: false,
  },
  variants: {
    fullWidth: {
      false: "",
      true: "time-field--full-width",
    },
  },
});

export type TimeFieldVariants = VariantProps<typeof timeFieldVariants>;

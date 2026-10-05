import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/checkbox-group.css. */
export const checkboxGroupVariants = tv({
  base: "checkbox-group",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    variant: {
      primary: "checkbox-group--primary",
      secondary: "checkbox-group--secondary",
    },
  },
});

export type CheckboxGroupVariants = VariantProps<typeof checkboxGroupVariants>;

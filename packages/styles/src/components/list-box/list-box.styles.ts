import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/list-box.css. */
export const listBoxVariants = tv({
  base: "list-box",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      danger: "list-box--danger",
      default: "list-box--default",
    },
  },
});

export type ListBoxVariants = VariantProps<typeof listBoxVariants>;

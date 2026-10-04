import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/button-group.css. */
export const buttonGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    orientation: "horizontal",
  },
  slots: {
    base: "button-group",
    separator: "button-group__separator",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "button-group--full-width",
      },
    },
    orientation: {
      horizontal: {
        base: "button-group--horizontal",
      },
      vertical: {
        base: "button-group--vertical",
      },
    },
  },
});

export type ButtonGroupVariants = VariantProps<typeof buttonGroupVariants>;

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * One multi-slot recipe: the shell, the control, the prefix and the suffix. Each part takes its
 * class from the group's context instead of calling the recipe again, so the variants cannot
 * drift apart. BEM names only: the Tailwind lives in components/color-input-group.css.
 */
export const colorInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  slots: {
    base: "color-input-group",
    input: "color-input-group__input",
    prefix: "color-input-group__prefix",
    suffix: "color-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "color-input-group--full-width",
      },
    },
    variant: {
      primary: {
        base: "color-input-group--primary",
      },
      secondary: {
        base: "color-input-group--secondary",
      },
    },
  },
});

export type ColorInputGroupVariants = VariantProps<typeof colorInputGroupVariants>;

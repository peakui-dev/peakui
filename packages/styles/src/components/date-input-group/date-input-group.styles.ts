import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * One multi-slot recipe shared by DateField, TimeField and the pickers: the shell, the segmented
 * input and its scroll container, the segment, the prefix and the suffix. Each part takes its class
 * from the group's context instead of calling the recipe again, so the variants cannot drift apart.
 * BEM names only: the Tailwind lives in components/date-input-group.css.
 */
export const dateInputGroupVariants = tv({
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  slots: {
    base: "date-input-group",
    input: "date-input-group__input",
    inputContainer: "date-input-group__input-container",
    prefix: "date-input-group__prefix",
    segment: "date-input-group__segment",
    suffix: "date-input-group__suffix",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "date-input-group--full-width",
      },
    },
    variant: {
      primary: {
        base: "date-input-group--primary",
      },
      secondary: {
        base: "date-input-group--secondary",
      },
    },
  },
});

export type DateInputGroupVariants = VariantProps<typeof dateInputGroupVariants>;

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/autocomplete.css. */
export const autocompleteVariants = tv({
  defaultVariants: {
    fullWidth: false,
    variant: "primary",
  },
  slots: {
    base: "autocomplete",
    clearButton: "autocomplete__clear-button",
    indicator: "autocomplete__indicator",
    popover: "autocomplete__popover",
    trigger: "autocomplete__trigger",
    value: "autocomplete__value",
  },
  variants: {
    fullWidth: {
      false: {},
      true: {
        base: "autocomplete--full-width",
        trigger: "autocomplete__trigger--full-width",
      },
    },
    variant: {
      primary: {
        base: "autocomplete--primary",
      },
      secondary: {
        base: "autocomplete--secondary",
      },
    },
  },
});

export type AutocompleteVariants = VariantProps<typeof autocompleteVariants>;

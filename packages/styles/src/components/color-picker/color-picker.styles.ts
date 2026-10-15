import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/color-picker.css. */
export const colorPickerVariants = tv({
  slots: {
    base: "color-picker",
    popover: "color-picker__popover",
    trigger: "color-picker__trigger",
  },
});

export type ColorPickerVariants = VariantProps<typeof colorPickerVariants>;

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/date-picker.css. */
export const datePickerVariants = tv({
  slots: {
    base: "date-picker",
    popover: "date-picker__popover",
    trigger: "date-picker__trigger",
    triggerIndicator: "date-picker__trigger-indicator",
  },
});

export type DatePickerVariants = VariantProps<typeof datePickerVariants>;

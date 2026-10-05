import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/radio.css. */
export const radioVariants = tv({
  slots: {
    base: "radio",
    content: "radio__content",
    control: "radio__control",
    indicator: "radio__indicator",
  },
});

export type RadioVariants = VariantProps<typeof radioVariants>;

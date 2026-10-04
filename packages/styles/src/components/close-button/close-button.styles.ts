import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM names and nothing else: the Tailwind lives in components/close-button.css. One variant
 * value ("default") — kept rather than dropped so the axis is addressable the day a second
 * variant lands, exactly as the ported recipe defines it.
 */
export const closeButtonVariants = tv({
  base: "close-button",
  defaultVariants: {
    variant: "default",
  },
  variants: {
    variant: {
      default: "close-button--default",
    },
  },
});

export type CloseButtonVariants = VariantProps<typeof closeButtonVariants>;

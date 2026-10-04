import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/kbd.css. */
export const kbdVariants = tv({
  defaultVariants: {},
  slots: {
    abbr: "kbd__abbr",
    base: "kbd",
    content: "kbd__content",
  },
  variants: {
    variant: {
      default: "kbd--default",
      light: "kbd--light",
    },
  },
});

export type KbdVariants = VariantProps<typeof kbdVariants>;

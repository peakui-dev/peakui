import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/card.css. */
export const cardVariants = tv({
  defaultVariants: {
    variant: "default",
  },
  slots: {
    base: "card",
    content: "card__content",
    description: "card__description",
    footer: "card__footer",
    header: "card__header",
    title: "card__title",
  },
  variants: {
    variant: {
      default: {
        base: "card--default",
      },
      secondary: {
        base: "card--secondary",
      },
      tertiary: {
        base: "card--tertiary",
      },
      transparent: {
        base: "card--transparent",
      },
    },
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;

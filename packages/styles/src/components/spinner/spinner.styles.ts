import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM-имена и ничего больше: Tailwind живёт в components/spinner.css. Правило то же, что у
 * Button, и по той же причине — утилита, попавшая сюда, ломает standalone-артефакт.
 */
export const spinnerVariants = tv({
  base: "spinner",
  defaultVariants: {
    color: "accent",
    size: "md",
  },
  variants: {
    color: {
      accent: "spinner--accent",
      current: "spinner--current",
      danger: "spinner--danger",
      success: "spinner--success",
      warning: "spinner--warning",
    },
    size: {
      lg: "spinner--lg",
      md: "spinner--md",
      sm: "spinner--sm",
      xl: "spinner--xl",
    },
  },
});

export type SpinnerVariants = VariantProps<typeof spinnerVariants>;

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM-имена и ничего больше: Tailwind живёт в components/input.css. Утилита, попавшая сюда, ломает
 * standalone-артефакт — потребитель вне React получает имя класса, за которым нет правила.
 */
export const inputVariants = tv({
  base: "input",
  defaultVariants: {
    variant: "primary",
  },
  variants: {
    fullWidth: {
      true: "input--full-width",
    },
    variant: {
      primary: "input--primary",
      secondary: "input--secondary",
    },
  },
});

export type InputVariants = VariantProps<typeof inputVariants>;

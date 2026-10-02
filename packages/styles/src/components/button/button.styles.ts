import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM-имена и ничего больше: Tailwind живёт в components/button.css. Утилита,
 * попавшая сюда, ломает standalone-артефакт — потребитель вне React получает
 * имя класса, за которым нет правила.
 */
export const buttonVariants = tv({
  base: "button",
  defaultVariants: {
    size: "md",
    variant: "primary",
  },
  variants: {
    fullWidth: {
      true: "button--full-width",
    },
    isIconOnly: {
      true: "button--icon-only",
    },
    size: {
      lg: "button--lg",
      md: "button--md",
      sm: "button--sm",
    },
    variant: {
      danger: "button--danger",
      "danger-soft": "button--danger-soft",
      ghost: "button--ghost",
      outline: "button--outline",
      primary: "button--primary",
      secondary: "button--secondary",
      tertiary: "button--tertiary",
    },
  },
});

export type ButtonVariants = VariantProps<typeof buttonVariants>;

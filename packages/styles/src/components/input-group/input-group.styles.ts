import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * Многослотовый рецепт: оболочка, контрол, префикс и суффикс. Каждая часть берёт своё имя из
 * контекста группы, а не вызывает рецепт заново — иначе один вызов на часть, и варианты
 * расходятся.
 */
export const inputGroupVariants = tv({
  defaultVariants: {
    variant: "primary",
  },
  slots: {
    base: "input-group",
    input: "input-group__input",
    prefix: "input-group__prefix",
    suffix: "input-group__suffix",
  },
  variants: {
    fullWidth: {
      true: {
        base: "input-group--full-width",
      },
    },
    variant: {
      primary: {
        base: "input-group--primary",
      },
      secondary: {
        base: "input-group--secondary",
      },
    },
  },
});

export type InputGroupVariants = VariantProps<typeof inputGroupVariants>;

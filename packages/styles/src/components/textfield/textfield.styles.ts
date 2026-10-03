import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * Блок называется textfield, одним словом, а не text-field: --color-field объявлен в теме, значит
 * text-field — это СГЕНЕРИРОВАННАЯ утилита Tailwind (color: var(--color-field)), и BEM-имя с таким
 * написанием столкнулось бы с ней. Эталон делает так же и по той же причине.
 */
export const textFieldVariants = tv({
  base: "textfield",
  variants: {
    fullWidth: {
      true: "textfield--full-width",
    },
  },
});

export type TextFieldVariants = VariantProps<typeof textFieldVariants>;

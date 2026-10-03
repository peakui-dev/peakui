import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * Слот description у эталона объявлен (fieldset__description), но за ним нет ни правила в CSS, ни
 * части в компоненте — мёртвое имя класса. Здесь его нет: часть приедет вместе с нуждой в ней.
 */
export const fieldsetVariants = tv({
  slots: {
    actions: "fieldset__actions",
    base: "fieldset",
    group: "fieldset__group",
    legend: "fieldset__legend",
  },
});

export type FieldsetVariants = VariantProps<typeof fieldsetVariants>;

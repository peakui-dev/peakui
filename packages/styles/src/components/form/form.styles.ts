import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/form.css. */
export const formVariants = tv({
  base: "form",
});

export type FormVariants = VariantProps<typeof formVariants>;

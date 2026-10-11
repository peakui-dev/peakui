import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/error-message.css. */
export const errorMessageVariants = tv({
  base: "error-message",
});

export type ErrorMessageVariants = VariantProps<typeof errorMessageVariants>;

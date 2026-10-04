import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/empty-state.css. */
export const emptyStateVariants = tv({
  base: "empty-state",
});

export type EmptyStateVariants = VariantProps<typeof emptyStateVariants>;

import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/list-box-section.css. */
export const listBoxSectionVariants = tv({
  base: "list-box-section",
});

export type ListBoxSectionVariants = VariantProps<typeof listBoxSectionVariants>;

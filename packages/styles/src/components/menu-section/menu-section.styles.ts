import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/menu-section.css. */
export const menuSectionVariants = tv({
  base: "menu-section",
});

export type MenuSectionVariants = VariantProps<typeof menuSectionVariants>;

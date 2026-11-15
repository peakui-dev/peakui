import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/menu.css. */
export const menuVariants = tv({
  slots: {
    base: "menu",
  },
});

export type MenuVariants = VariantProps<typeof menuVariants>;

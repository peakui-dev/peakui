import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/context-menu.css. */
export const contextMenuVariants = tv({
  slots: {
    anchor: "context-menu__anchor",
    popover: "context-menu__popover",
    trigger: "context-menu__trigger",
  },
});

export type ContextMenuVariants = VariantProps<typeof contextMenuVariants>;

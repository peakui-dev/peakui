import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/sheet.css. */
export const sheetVariants = tv({
  base: "sheet",
});

export type SheetVariants = VariantProps<typeof sheetVariants>;

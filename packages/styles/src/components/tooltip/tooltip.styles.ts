import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM names and nothing else: the Tailwind lives in components/tooltip.css. The tooltip has no
 * variants — only the block and the trigger element; the offset from the trigger and the
 * placement come from RAC props.
 */
export const tooltipVariants = tv({
  slots: {
    base: "tooltip",
    trigger: "tooltip__trigger",
  },
});

export type TooltipVariants = VariantProps<typeof tooltipVariants>;

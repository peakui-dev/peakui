import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM-имена и ничего больше: Tailwind живёт в components/tooltip.css. У подсказки нет вариантов —
 * только блок и элемент триггера; смещение до триггера и положение задают пропы RAC.
 */
export const tooltipVariants = tv({
  slots: {
    base: "tooltip",
    trigger: "tooltip__trigger",
  },
});

export type TooltipVariants = VariantProps<typeof tooltipVariants>;

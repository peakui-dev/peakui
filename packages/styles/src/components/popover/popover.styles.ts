import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM names and nothing else: the Tailwind lives in components/popover.css. The popover has no
 * variants — only the block and its elements; placement and offset come from RAC props.
 */
export const popoverVariants = tv({
  slots: {
    base: "popover",
    dialog: "popover__dialog",
    heading: "popover__heading",
    trigger: "popover__trigger",
  },
});

export type PopoverVariants = VariantProps<typeof popoverVariants>;

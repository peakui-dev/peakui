import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/*
 * BEM names and nothing else: the Tailwind lives in components/segmented-control.css.
 *
 * `size` is a modifier on the base only. The stylesheet reaches the segment by descent
 * (`.segmented-control--sm .segmented-control__item`), so the item carries no size class and the
 * Root is the single place a size is expressed.
 */
export const segmentedControlVariants = tv({
  defaultVariants: {
    size: "md",
  },
  slots: {
    base: "segmented-control",
    item: "segmented-control__item",
  },
  variants: {
    size: {
      lg: {
        base: "segmented-control--lg",
      },
      md: {
        base: "segmented-control--md",
      },
      sm: {
        base: "segmented-control--sm",
      },
    },
  },
});

export type SegmentedControlVariants = VariantProps<typeof segmentedControlVariants>;

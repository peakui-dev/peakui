import type {VariantProps} from "tailwind-variants";

import {tv} from "tailwind-variants";

/* BEM names and nothing else: the Tailwind lives in components/skeleton.css. */
export const skeletonVariants = tv({
  slots: {
    base: "skeleton",
  },
  variants: {
    animationType: {
      none: "skeleton--none",
      pulse: "skeleton--pulse",
      shimmer: "skeleton--shimmer",
    },
  },
  defaultVariants: {
    animationType: "shimmer",
  },
});

export type SkeletonVariants = VariantProps<typeof skeletonVariants>;

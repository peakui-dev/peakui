import type {ComponentProps} from "react";

import {SkeletonRoot} from "./skeleton.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Skeleton = Object.assign(SkeletonRoot, {
  Root: SkeletonRoot,
});

export type Skeleton = {
  Props: ComponentProps<typeof SkeletonRoot>;
  RootProps: ComponentProps<typeof SkeletonRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SkeletonRoot};

export type {SkeletonRootProps, SkeletonRootProps as SkeletonProps} from "./skeleton.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {skeletonVariants} from "@peakui/styles";

export type {SkeletonVariants} from "@peakui/styles";

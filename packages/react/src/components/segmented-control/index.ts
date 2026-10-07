import type {ComponentProps} from "react";

import {SegmentedControlItem, SegmentedControlRoot} from "./segmented-control.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SegmentedControl = Object.assign(SegmentedControlRoot, {
  Root: SegmentedControlRoot,
  Item: SegmentedControlItem,
});

export type SegmentedControl = {
  Props: ComponentProps<typeof SegmentedControlRoot>;
  RootProps: ComponentProps<typeof SegmentedControlRoot>;
  ItemProps: ComponentProps<typeof SegmentedControlItem>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SegmentedControlRoot, SegmentedControlItem};

export type {
  SegmentedControlRootProps,
  SegmentedControlRootProps as SegmentedControlProps,
  SegmentedControlItemProps,
} from "./segmented-control.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {segmentedControlVariants} from "@peakui/styles";

export type {SegmentedControlVariants} from "@peakui/styles";

import type {ComponentProps} from "react";

import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "./date-input-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DateInputGroup = Object.assign(DateInputGroupRoot, {
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Prefix: DateInputGroupPrefix,
  Root: DateInputGroupRoot,
  Segment: DateInputGroupSegment,
  Suffix: DateInputGroupSuffix,
});

export type DateInputGroup = {
  InputContainerProps: ComponentProps<typeof DateInputGroupInputContainer>;
  InputProps: ComponentProps<typeof DateInputGroupInput>;
  PrefixProps: ComponentProps<typeof DateInputGroupPrefix>;
  Props: ComponentProps<typeof DateInputGroupRoot>;
  RootProps: ComponentProps<typeof DateInputGroupRoot>;
  SegmentProps: ComponentProps<typeof DateInputGroupSegment>;
  SuffixProps: ComponentProps<typeof DateInputGroupSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
};

export type {
  DateInputGroupInputContainerProps,
  DateInputGroupInputProps,
  DateInputGroupPrefixProps,
  DateInputGroupRootProps,
  DateInputGroupRootProps as DateInputGroupProps,
  DateInputGroupSegmentProps,
  DateInputGroupSuffixProps,
} from "./date-input-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateInputGroupVariants} from "@peakui/styles";

export type {DateInputGroupVariants} from "@peakui/styles";

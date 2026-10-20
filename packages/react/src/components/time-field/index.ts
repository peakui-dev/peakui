import type {ComponentProps} from "react";

import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group/index.ts";

import {TimeFieldRoot} from "./time-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TimeField = Object.assign(TimeFieldRoot, {
  Group: DateInputGroupRoot,
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Prefix: DateInputGroupPrefix,
  Root: TimeFieldRoot,
  Segment: DateInputGroupSegment,
  Suffix: DateInputGroupSuffix,
});

export type TimeField = {
  GroupProps: ComponentProps<typeof DateInputGroupRoot>;
  InputContainerProps: ComponentProps<typeof DateInputGroupInputContainer>;
  InputProps: ComponentProps<typeof DateInputGroupInput>;
  PrefixProps: ComponentProps<typeof DateInputGroupPrefix>;
  Props: ComponentProps<typeof TimeFieldRoot>;
  RootProps: ComponentProps<typeof TimeFieldRoot>;
  SegmentProps: ComponentProps<typeof DateInputGroupSegment>;
  SuffixProps: ComponentProps<typeof DateInputGroupSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {TimeFieldRoot};

export type {TimeFieldRootProps, TimeFieldRootProps as TimeFieldProps} from "./time-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateFieldVariants} from "@peakui/styles";

export type {TimeFieldVariants} from "@peakui/styles";

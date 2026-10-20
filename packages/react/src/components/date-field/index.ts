import type {ComponentProps} from "react";

import {
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupRoot,
  DateInputGroupSegment,
  DateInputGroupSuffix,
} from "../date-input-group/index.ts";

import {DateFieldRoot} from "./date-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DateField = Object.assign(DateFieldRoot, {
  Group: DateInputGroupRoot,
  Input: DateInputGroupInput,
  InputContainer: DateInputGroupInputContainer,
  Prefix: DateInputGroupPrefix,
  Root: DateFieldRoot,
  Segment: DateInputGroupSegment,
  Suffix: DateInputGroupSuffix,
});

export type DateField = {
  GroupProps: ComponentProps<typeof DateInputGroupRoot>;
  InputContainerProps: ComponentProps<typeof DateInputGroupInputContainer>;
  InputProps: ComponentProps<typeof DateInputGroupInput>;
  PrefixProps: ComponentProps<typeof DateInputGroupPrefix>;
  Props: ComponentProps<typeof DateFieldRoot>;
  RootProps: ComponentProps<typeof DateFieldRoot>;
  SegmentProps: ComponentProps<typeof DateInputGroupSegment>;
  SuffixProps: ComponentProps<typeof DateInputGroupSuffix>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {DateFieldRoot};

export type {DateFieldRootProps, DateFieldRootProps as DateFieldProps} from "./date-field.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {dateFieldVariants} from "@peakui/styles";

export type {DateFieldVariants} from "@peakui/styles";

import type {ComponentProps} from "react";

import {
  PopoverArrow,
  PopoverContent,
  PopoverDialog,
  PopoverHeading,
  PopoverRoot,
  PopoverTrigger,
} from "./popover.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Dialog: PopoverDialog,
  Arrow: PopoverArrow,
  Content: PopoverContent,
  Heading: PopoverHeading,
});

export type Popover = {
  Props: ComponentProps<typeof PopoverRoot>;
  RootProps: ComponentProps<typeof PopoverRoot>;
  TriggerProps: ComponentProps<typeof PopoverTrigger>;
  DialogProps: ComponentProps<typeof PopoverDialog>;
  ArrowProps: ComponentProps<typeof PopoverArrow>;
  ContentProps: ComponentProps<typeof PopoverContent>;
  HeadingProps: ComponentProps<typeof PopoverHeading>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {PopoverArrow, PopoverContent, PopoverDialog, PopoverHeading, PopoverRoot, PopoverTrigger};

export type {
  PopoverRootProps,
  PopoverRootProps as PopoverProps,
  PopoverTriggerProps,
  PopoverDialogProps,
  PopoverArrowProps,
  PopoverContentProps,
  PopoverHeadingProps,
} from "./popover.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {popoverVariants} from "@peakui/styles";

export type {PopoverVariants} from "@peakui/styles";

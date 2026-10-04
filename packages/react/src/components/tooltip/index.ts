import type {ComponentProps} from "react";

import {TooltipArrow, TooltipContent, TooltipRoot, TooltipTrigger} from "./tooltip.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Tooltip = Object.assign(TooltipRoot, {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Arrow: TooltipArrow,
});

export type Tooltip = {
  Props: ComponentProps<typeof TooltipRoot>;
  RootProps: ComponentProps<typeof TooltipRoot>;
  TriggerProps: ComponentProps<typeof TooltipTrigger>;
  ContentProps: ComponentProps<typeof TooltipContent>;
  ArrowProps: ComponentProps<typeof TooltipArrow>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow};

export type {
  TooltipRootProps,
  TooltipRootProps as TooltipProps,
  TooltipArrowProps,
  TooltipContentProps,
  TooltipTriggerProps,
} from "./tooltip.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tooltipVariants} from "@peakui/styles";

export type {TooltipVariants} from "@peakui/styles";

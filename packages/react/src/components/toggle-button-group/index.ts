import type {ComponentProps} from "react";

import {ToggleButtonGroupRoot, ToggleButtonGroupSeparator} from "./toggle-button-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ToggleButtonGroup = Object.assign(ToggleButtonGroupRoot, {
  Root: ToggleButtonGroupRoot,
  Separator: ToggleButtonGroupSeparator,
});

export type ToggleButtonGroup = {
  Props: ComponentProps<typeof ToggleButtonGroupRoot>;
  RootProps: ComponentProps<typeof ToggleButtonGroupRoot>;
  SeparatorProps: ComponentProps<typeof ToggleButtonGroupSeparator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ToggleButtonGroupRoot, ToggleButtonGroupSeparator};

export type {
  ToggleButtonGroupRootProps,
  ToggleButtonGroupRootProps as ToggleButtonGroupProps,
  ToggleButtonGroupSeparatorProps,
} from "./toggle-button-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {ToggleButtonGroupContext, TOGGLE_BUTTON_GROUP_CHILD} from "./toggle-button-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {toggleButtonGroupVariants} from "@peakui/styles";

export type {ToggleButtonGroupVariants} from "@peakui/styles";

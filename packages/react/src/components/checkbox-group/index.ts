import type {ComponentProps} from "react";

import {CheckboxGroupRoot} from "./checkbox-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const CheckboxGroup = Object.assign(CheckboxGroupRoot, {
  Root: CheckboxGroupRoot,
});

export type CheckboxGroup = {
  Props: ComponentProps<typeof CheckboxGroupRoot>;
  RootProps: ComponentProps<typeof CheckboxGroupRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxGroupRoot};

export type {
  CheckboxGroupRootProps,
  CheckboxGroupRootProps as CheckboxGroupProps,
} from "./checkbox-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {CheckboxGroupContext} from "./checkbox-group-context.ts";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {checkboxGroupVariants} from "@peakui/styles";

export type {CheckboxGroupVariants} from "@peakui/styles";

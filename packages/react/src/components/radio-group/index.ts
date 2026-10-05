import type {ComponentProps} from "react";

import {RadioGroupRoot} from "./radio-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const RadioGroup = Object.assign(RadioGroupRoot, {
  Root: RadioGroupRoot,
});

export type RadioGroup = {
  Props: ComponentProps<typeof RadioGroupRoot>;
  RootProps: ComponentProps<typeof RadioGroupRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {RadioGroupRoot};

export type {RadioGroupRootProps, RadioGroupRootProps as RadioGroupProps} from "./radio-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radioGroupVariants} from "@peakui/styles";

export type {RadioGroupVariants} from "@peakui/styles";

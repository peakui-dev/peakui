import type {ComponentProps} from "react";

import {SwitchGroupRoot} from "./switch-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const SwitchGroup = Object.assign(SwitchGroupRoot, {
  Root: SwitchGroupRoot,
});

export type SwitchGroup = {
  Props: ComponentProps<typeof SwitchGroupRoot>;
  RootProps: ComponentProps<typeof SwitchGroupRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SwitchGroupRoot};

export type {
  SwitchGroupRootProps,
  SwitchGroupRootProps as SwitchGroupProps,
} from "./switch-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {switchGroupVariants} from "@peakui/styles";

export type {SwitchGroupVariants} from "@peakui/styles";

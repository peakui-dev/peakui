import type {ComponentProps} from "react";

import {DisclosureGroupRoot} from "./disclosure-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const DisclosureGroup = Object.assign(DisclosureGroupRoot, {
  Root: DisclosureGroupRoot,
});

export type DisclosureGroup = {
  Props: ComponentProps<typeof DisclosureGroupRoot>;
  RootProps: ComponentProps<typeof DisclosureGroupRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {DisclosureGroupRoot};

export type {
  DisclosureGroupRootProps,
  DisclosureGroupRootProps as DisclosureGroupProps,
} from "./disclosure-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {disclosureGroupVariants} from "@peakui/styles";

export type {DisclosureGroupVariants} from "@peakui/styles";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useDisclosureGroupNavigation} from "./use-disclosure-group-navigation.ts";

export type {
  UseDisclosureGroupNavigationProps,
  UseDisclosureGroupNavigationReturn,
} from "./use-disclosure-group-navigation.ts";

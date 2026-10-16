import type {ComponentProps} from "react";

import {AvatarGroupCount, AvatarGroupRoot} from "./avatar-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const AvatarGroup = Object.assign(AvatarGroupRoot, {
  Root: AvatarGroupRoot,
  Count: AvatarGroupCount,
});

export type AvatarGroup = {
  Props: ComponentProps<typeof AvatarGroupRoot>;
  RootProps: ComponentProps<typeof AvatarGroupRoot>;
  CountProps: ComponentProps<typeof AvatarGroupCount>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {AvatarGroupRoot, AvatarGroupCount};

export type {
  AvatarGroupRootProps,
  AvatarGroupRootProps as AvatarGroupProps,
  AvatarGroupCountProps,
} from "./avatar-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Context
 * -----------------------------------------------------------------------------------------------*/
export {AvatarGroupContext} from "./avatar-group-context.ts";

export type {AvatarGroupContextValue} from "./avatar-group-context.ts";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {avatarGroupVariants} from "@peakui/styles";

export type {AvatarGroupVariants} from "@peakui/styles";

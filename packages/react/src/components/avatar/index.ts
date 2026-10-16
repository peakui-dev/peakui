import type {ComponentProps} from "react";

import {AVATAR_GROUP_CHILD, AVATAR_SLOT} from "../avatar-group/avatar-group-context.ts";

import {AvatarFallback, AvatarImage, AvatarRoot} from "./avatar.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Avatar = Object.assign(AvatarRoot, {
  Root: AvatarRoot,
  Image: AvatarImage,
  Fallback: AvatarFallback,
});

export type Avatar = {
  Props: ComponentProps<typeof AvatarRoot>;
  RootProps: ComponentProps<typeof AvatarRoot>;
  ImageProps: ComponentProps<typeof AvatarImage>;
  FallbackProps: ComponentProps<typeof AvatarFallback>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {AvatarRoot, AvatarImage, AvatarFallback};

export type {
  AvatarRootProps,
  AvatarRootProps as AvatarProps,
  AvatarImageProps,
  AvatarFallbackProps,
} from "./avatar.tsx";

/* -------------------------------------------------------------------------------------------------
 * Markers
 *
 * Re-exported for the type declarations of the props that carry them.
 * -----------------------------------------------------------------------------------------------*/
export {AVATAR_GROUP_CHILD, AVATAR_SLOT};

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {avatarVariants} from "@peakui/styles";

export type {AvatarVariants} from "@peakui/styles";

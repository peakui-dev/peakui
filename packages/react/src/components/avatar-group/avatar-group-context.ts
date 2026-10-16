"use client";

import type {AvatarVariants, avatarGroupVariants} from "@peakui/styles";

import {createContext} from "react";

/* -------------------------------------------------------------------------------------------------
 * AvatarGroup Context
 *
 * Lives beside the group but is read by Avatar, which is why it is its own module: Avatar and
 * AvatarGroup import each other's parts, and the context is the one thing both need first.
 * -----------------------------------------------------------------------------------------------*/
interface AvatarGroupContextValue {
  slots?: ReturnType<typeof avatarGroupVariants>;
  size?: AvatarVariants["size"];
  color?: AvatarVariants["color"];
  variant?: AvatarVariants["variant"];
}

const AvatarGroupContext = createContext<AvatarGroupContextValue>({});

/** Marks direct children of AvatarGroup so nested Avatars do not inherit group props. */
const AVATAR_GROUP_CHILD = "__avatar_group_child";

/**
 * Names the `data-slot` of an Avatar root that another part owns, as `AvatarGroup.Count` does.
 * The root writes its `data-slot` after its props spread, so a plain `data-slot` prop cannot
 * carry this.
 */
const AVATAR_SLOT = "__avatar_slot";

export {AvatarGroupContext, AVATAR_GROUP_CHILD, AVATAR_SLOT};
export type {AvatarGroupContextValue};

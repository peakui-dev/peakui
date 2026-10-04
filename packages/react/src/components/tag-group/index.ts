import type {ComponentProps} from "react";

import {TagGroupContext, TagGroupList, TagGroupRoot} from "./tag-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const TagGroup = Object.assign(TagGroupRoot, {
  Root: TagGroupRoot,
  List: TagGroupList,
});

export type TagGroup = {
  Props: ComponentProps<typeof TagGroupRoot>;
  RootProps: ComponentProps<typeof TagGroupRoot>;
  ListProps: ComponentProps<typeof TagGroupList>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {TagGroupRoot, TagGroupList, TagGroupContext};

export type {
  TagGroupRootProps,
  TagGroupRootProps as TagGroupProps,
  TagGroupListProps,
} from "./tag-group.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tagGroupVariants} from "@peakui/styles";

export type {TagGroupVariants} from "@peakui/styles";

import type {ComponentProps} from "react";

import {TagRemoveButton, TagRoot} from "./tag.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Tag = Object.assign(TagRoot, {
  Root: TagRoot,
  RemoveButton: TagRemoveButton,
});

export type Tag = {
  Props: ComponentProps<typeof TagRoot>;
  RootProps: ComponentProps<typeof TagRoot>;
  RemoveButtonProps: ComponentProps<typeof TagRemoveButton>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {TagRoot, TagRemoveButton};

export type {TagRootProps, TagRemoveButtonProps} from "./tag.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {tagVariants} from "@peakui/styles";

export type {TagVariants} from "@peakui/styles";

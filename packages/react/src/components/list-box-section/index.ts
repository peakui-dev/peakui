import type {ComponentProps} from "react";

import {ListBoxSectionRoot} from "./list-box-section.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBoxSection = Object.assign(ListBoxSectionRoot, {
  Root: ListBoxSectionRoot,
});

export type ListBoxSection = {
  Props: ComponentProps<typeof ListBoxSectionRoot>;
  RootProps: ComponentProps<typeof ListBoxSectionRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxSectionRoot};

export type {
  ListBoxSectionRootProps,
  ListBoxSectionRootProps as ListBoxSectionProps,
} from "./list-box-section.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listBoxSectionVariants} from "@peakui/styles";

export type {ListBoxSectionVariants} from "@peakui/styles";

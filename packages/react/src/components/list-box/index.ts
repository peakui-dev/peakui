import type {ComponentProps} from "react";

import {ListBoxItem, ListBoxItemIndicator} from "../list-box-item/index.ts";
import {ListBoxSection} from "../list-box-section/index.ts";

import {ListBoxRoot} from "./list-box.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ListBox = Object.assign(ListBoxRoot, {
  Root: ListBoxRoot,
  Item: ListBoxItem,
  ItemIndicator: ListBoxItemIndicator,
  Section: ListBoxSection,
});

export type ListBox = {
  Props: ComponentProps<typeof ListBoxRoot>;
  RootProps: ComponentProps<typeof ListBoxRoot>;
  ItemProps: ComponentProps<typeof ListBoxItem>;
  SectionProps: ComponentProps<typeof ListBoxSection>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxRoot};

export type {ListBoxRootProps, ListBoxRootProps as ListBoxProps} from "./list-box.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {listBoxVariants} from "@peakui/styles";

export type {ListBoxVariants} from "@peakui/styles";

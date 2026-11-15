import type {ComponentProps} from "react";

import {MenuItemIndicator, MenuItemRoot, MenuItemSubmenuIndicator} from "../menu-item/index.ts";
import {MenuSectionRoot} from "../menu-section/index.ts";

import {MenuRoot} from "./menu.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Item: MenuItemRoot,
  Section: MenuSectionRoot,
  ItemIndicator: MenuItemIndicator,
  SubmenuIndicator: MenuItemSubmenuIndicator,
});

export type Menu = {
  Props: ComponentProps<typeof MenuRoot>;
  RootProps: ComponentProps<typeof MenuRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {MenuRoot};

export type {MenuRootProps, MenuRootProps as MenuProps} from "./menu.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {menuVariants} from "@peakui/styles";

export type {MenuVariants} from "@peakui/styles";

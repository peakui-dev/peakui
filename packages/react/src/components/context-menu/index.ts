import type {ComponentProps} from "react";

import {MenuItemIndicator, MenuItemRoot, MenuItemSubmenuIndicator} from "../menu-item/index.ts";
import {MenuSectionRoot} from "../menu-section/index.ts";

import {
  ContextMenuMenu,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
} from "./context-menu.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ContextMenu = Object.assign(ContextMenuRoot, {
  Root: ContextMenuRoot,
  Trigger: ContextMenuTrigger,
  Popover: ContextMenuPopover,
  Menu: ContextMenuMenu,
  Item: MenuItemRoot,
  Section: MenuSectionRoot,
  ItemIndicator: MenuItemIndicator,
  SubmenuIndicator: MenuItemSubmenuIndicator,
  SubmenuTrigger: ContextMenuSubmenuTrigger,
});

export type ContextMenu<T extends object = object> = {
  Props: ComponentProps<typeof ContextMenuRoot>;
  RootProps: ComponentProps<typeof ContextMenuRoot>;
  TriggerProps: ComponentProps<typeof ContextMenuTrigger>;
  PopoverProps: ComponentProps<typeof ContextMenuPopover>;
  MenuProps: ComponentProps<typeof ContextMenuMenu<T>>;
  SectionProps: ComponentProps<typeof MenuSectionRoot>;
  ItemProps: ComponentProps<typeof MenuItemRoot>;
  ItemIndicatorProps: ComponentProps<typeof MenuItemIndicator>;
  SubmenuIndicatorProps: ComponentProps<typeof MenuItemSubmenuIndicator>;
  SubmenuTriggerProps: ComponentProps<typeof ContextMenuSubmenuTrigger>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {
  ContextMenuMenu,
  ContextMenuPopover,
  ContextMenuRoot,
  ContextMenuSubmenuTrigger,
  ContextMenuTrigger,
};

export type {
  ContextMenuMenuProps,
  ContextMenuPopoverProps,
  ContextMenuRootProps,
  ContextMenuRootProps as ContextMenuProps,
  ContextMenuSubmenuTriggerProps,
  ContextMenuTriggerProps,
} from "./context-menu.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {contextMenuVariants} from "@peakui/styles";

export type {ContextMenuVariants} from "@peakui/styles";

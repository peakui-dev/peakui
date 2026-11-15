"use client";

import type {MenuVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {menuVariants} from "@peakui/styles";
import {Menu as MenuPrimitive} from "react-aria-components/Menu";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Menu Root
 * -----------------------------------------------------------------------------------------------*/
interface MenuRootProps<T extends object>
  extends ComponentPropsWithRef<typeof MenuPrimitive<T>>, MenuVariants {}

/*
 * An inline menu: the RAC Menu with no trigger and no popover. `data-slot` sits before the props
 * spread on purpose, so ContextMenu can reuse this root under its own slot name.
 */
function MenuRoot<T extends object>({className, ...props}: MenuRootProps<T>) {
  return (
    <MenuPrimitive
      className={composeTwRenderProps(className, menuVariants().base())}
      data-selection-mode={props.selectionMode}
      data-slot="menu"
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MenuRoot};

export type {MenuRootProps};

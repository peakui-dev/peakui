"use client";

import type {MenuSectionVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {menuSectionVariants} from "@peakui/styles";
import React from "react";
import {MenuSection as MenuSectionPrimitive} from "react-aria-components/Menu";

/* -------------------------------------------------------------------------------------------------
 * Menu Section Root
 * -----------------------------------------------------------------------------------------------*/
interface MenuSectionRootProps
  extends ComponentPropsWithRef<typeof MenuSectionPrimitive>, MenuSectionVariants {
  className?: string;
}

const MenuSectionRoot = ({children, className, ...props}: MenuSectionRootProps) => {
  const styles = React.useMemo(
    () => menuSectionVariants({class: typeof className === "string" ? className : undefined}),
    [className],
  );

  return (
    <MenuSectionPrimitive className={styles} {...props} data-slot="menu-section">
      {children}
    </MenuSectionPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MenuSectionRoot};

export type {MenuSectionRootProps};

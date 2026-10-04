import type {ComponentProps} from "react";

import {MenuSectionRoot} from "./menu-section.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const MenuSection = Object.assign(MenuSectionRoot, {
  Root: MenuSectionRoot,
});

export type MenuSection = {
  Props: ComponentProps<typeof MenuSectionRoot>;
  RootProps: ComponentProps<typeof MenuSectionRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {MenuSectionRoot};

export type {
  MenuSectionRootProps,
  MenuSectionRootProps as MenuSectionProps,
} from "./menu-section.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {menuSectionVariants} from "@peakui/styles";

export type {MenuSectionVariants} from "@peakui/styles";

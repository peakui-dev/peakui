import type {ComponentProps} from "react";

import {ToolbarRoot} from "./toolbar.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Toolbar = Object.assign(ToolbarRoot, {
  Root: ToolbarRoot,
});

export type Toolbar = {
  Props: ComponentProps<typeof ToolbarRoot>;
  RootProps: ComponentProps<typeof ToolbarRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ToolbarRoot};

export type {ToolbarRootProps, ToolbarRootProps as ToolbarProps} from "./toolbar.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {toolbarVariants} from "@peakui/styles";

export type {ToolbarVariants} from "@peakui/styles";

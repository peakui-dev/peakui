import type {ComponentProps} from "react";

import {SeparatorRoot} from "./separator.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Separator = Object.assign(SeparatorRoot, {
  Root: SeparatorRoot,
});

export type Separator = {
  Props: ComponentProps<typeof SeparatorRoot>;
  RootProps: ComponentProps<typeof SeparatorRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SeparatorRoot};

export type {SeparatorRootProps, SeparatorRootProps as SeparatorProps} from "./separator.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {separatorVariants} from "@peakui/styles";

export type {SeparatorVariants} from "@peakui/styles";

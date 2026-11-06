import type {ComponentProps} from "react";

import {SheetRoot} from "./sheet.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Sheet = Object.assign(SheetRoot, {
  Root: SheetRoot,
});

export type Sheet = {
  Props: ComponentProps<typeof SheetRoot>;
  RootProps: ComponentProps<typeof SheetRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SheetRoot};

export type {SheetRootProps, SheetRootProps as SheetProps} from "./sheet.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {sheetVariants} from "@peakui/styles";

export type {SheetVariants} from "@peakui/styles";

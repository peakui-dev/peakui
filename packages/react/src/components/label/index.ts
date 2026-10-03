import type {ComponentProps} from "react";

import {LabelRoot} from "./label.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Label = Object.assign(LabelRoot, {
  Root: LabelRoot,
});

export type Label = {
  Props: ComponentProps<typeof LabelRoot>;
  RootProps: ComponentProps<typeof LabelRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {LabelRoot};

export type {LabelRootProps, LabelRootProps as LabelProps} from "./label.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {labelVariants} from "@peakui/styles";

export type {LabelVariants} from "@peakui/styles";

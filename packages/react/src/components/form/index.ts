import type {ComponentProps} from "react";

import {FormRoot} from "./form.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Form = Object.assign(FormRoot, {
  Root: FormRoot,
});

export type Form = {
  Props: ComponentProps<typeof FormRoot>;
  RootProps: ComponentProps<typeof FormRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {FormRoot};

export type {FormRootProps, FormRootProps as FormProps} from "./form.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {formVariants} from "@peakui/styles";

export type {FormVariants} from "@peakui/styles";

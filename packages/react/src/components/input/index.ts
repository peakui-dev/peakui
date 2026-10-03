import type {ComponentProps} from "react";

import {InputRoot} from "./input.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Input = Object.assign(InputRoot, {
  Root: InputRoot,
});

export type Input = {
  Props: ComponentProps<typeof InputRoot>;
  RootProps: ComponentProps<typeof InputRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {InputRoot};

export type {InputRootProps, InputRootProps as InputProps} from "./input.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {inputVariants} from "@peakui/styles";

export type {InputVariants} from "@peakui/styles";

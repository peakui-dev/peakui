import type {ComponentProps} from "react";

import {ButtonRoot} from "./button.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Button = Object.assign(ButtonRoot, {
  Root: ButtonRoot,
});

export type Button = {
  Props: ComponentProps<typeof ButtonRoot>;
  RootProps: ComponentProps<typeof ButtonRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ButtonRoot};

export type {ButtonRootProps, ButtonRootProps as ButtonProps} from "./button.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {buttonVariants} from "@peakui/styles";

export type {ButtonVariants} from "@peakui/styles";

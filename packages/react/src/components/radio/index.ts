import type {ComponentProps} from "react";

import {RadioContent, RadioControl, RadioIndicator, RadioRoot} from "./radio.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Radio = Object.assign(RadioRoot, {
  Root: RadioRoot,
  Content: RadioContent,
  Control: RadioControl,
  Indicator: RadioIndicator,
});

export type Radio = {
  Props: ComponentProps<typeof RadioRoot>;
  RootProps: ComponentProps<typeof RadioRoot>;
  ContentProps: ComponentProps<typeof RadioContent>;
  ControlProps: ComponentProps<typeof RadioControl>;
  IndicatorProps: ComponentProps<typeof RadioIndicator>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {RadioContent, RadioControl, RadioIndicator, RadioRoot};

export type {
  RadioRootProps,
  RadioRootProps as RadioProps,
  RadioContentProps,
  RadioControlProps,
  RadioIndicatorProps,
  RadioFieldRenderProps,
  RadioButtonRenderProps,
} from "./radio.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {radioVariants} from "@peakui/styles";

export type {RadioVariants} from "@peakui/styles";

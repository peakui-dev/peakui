import type {ComponentProps} from "react";

import {SwitchContent, SwitchControl, SwitchIcon, SwitchRoot, SwitchThumb} from "./switch.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Switch = Object.assign(SwitchRoot, {
  Root: SwitchRoot,
  Content: SwitchContent,
  Control: SwitchControl,
  Thumb: SwitchThumb,
  Icon: SwitchIcon,
});

export type Switch = {
  Props: ComponentProps<typeof SwitchRoot>;
  RootProps: ComponentProps<typeof SwitchRoot>;
  ContentProps: ComponentProps<typeof SwitchContent>;
  ControlProps: ComponentProps<typeof SwitchControl>;
  ThumbProps: ComponentProps<typeof SwitchThumb>;
  IconProps: ComponentProps<typeof SwitchIcon>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {SwitchContent, SwitchControl, SwitchIcon, SwitchRoot, SwitchThumb};

export type {
  SwitchRootProps,
  SwitchRootProps as SwitchProps,
  SwitchContentProps,
  SwitchControlProps,
  SwitchThumbProps,
  SwitchIconProps,
  SwitchFieldRenderProps,
  SwitchButtonRenderProps,
} from "./switch.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {switchVariants} from "@peakui/styles";

export type {SwitchVariants} from "@peakui/styles";

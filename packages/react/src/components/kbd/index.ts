import type {ComponentProps} from "react";

import {KbdAbbr, KbdContent, KbdRoot} from "./kbd.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Kbd = Object.assign(KbdRoot, {
  Root: KbdRoot,
  Abbr: KbdAbbr,
  Content: KbdContent,
});

export type Kbd = {
  Props: ComponentProps<typeof KbdRoot>;
  RootProps: ComponentProps<typeof KbdRoot>;
  AbbrProps: ComponentProps<typeof KbdAbbr>;
  ContentProps: ComponentProps<typeof KbdContent>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {KbdRoot, KbdAbbr, KbdContent};

export type {
  KbdRootProps,
  KbdAbbrProps,
  KbdContentProps,
  KbdRootProps as KbdProps,
} from "./kbd.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {kbdVariants} from "@peakui/styles";

export type {KbdVariants} from "@peakui/styles";

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -----------------------------------------------------------------------------------------------*/
export {kbdKeysMap, kbdKeysLabelMap} from "./kbd.constants.ts";

export type {KbdKey} from "./kbd.constants.ts";

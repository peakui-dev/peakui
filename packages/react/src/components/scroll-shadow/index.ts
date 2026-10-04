import type {ComponentProps} from "react";

import {ScrollShadowRoot} from "./scroll-shadow.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const ScrollShadow = Object.assign(ScrollShadowRoot, {
  Root: ScrollShadowRoot,
});

export type ScrollShadow = {
  Props: ComponentProps<typeof ScrollShadowRoot>;
  RootProps: ComponentProps<typeof ScrollShadowRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {ScrollShadowRoot};

export type {
  ScrollShadowRootProps,
  ScrollShadowRootProps as ScrollShadowProps,
  ScrollShadowVisibility,
} from "./scroll-shadow.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {scrollShadowVariants} from "@peakui/styles";

export type {ScrollShadowVariants} from "@peakui/styles";

/* -------------------------------------------------------------------------------------------------
 * Hooks
 * -----------------------------------------------------------------------------------------------*/
export {useScrollShadow} from "./use-scroll-shadow.ts";

export type {UseScrollShadowProps} from "./use-scroll-shadow.ts";

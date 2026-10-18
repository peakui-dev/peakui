import type {ComponentProps} from "react";

import {BadgeAnchor, BadgeLabel, BadgeRoot} from "./badge.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Badge = Object.assign(BadgeRoot, {
  Root: BadgeRoot,
  Label: BadgeLabel,
  Anchor: BadgeAnchor,
});

export type Badge = {
  Props: ComponentProps<typeof BadgeRoot>;
  RootProps: ComponentProps<typeof BadgeRoot>;
  LabelProps: ComponentProps<typeof BadgeLabel>;
  AnchorProps: ComponentProps<typeof BadgeAnchor>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {BadgeRoot, BadgeLabel, BadgeAnchor};

export type {
  BadgeRootProps,
  BadgeRootProps as BadgeProps,
  BadgeLabelProps,
  BadgeAnchorProps,
} from "./badge.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {badgeVariants} from "@peakui/styles";

export type {BadgeVariants} from "@peakui/styles";

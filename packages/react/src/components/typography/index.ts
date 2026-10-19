import type {ComponentProps} from "react";

import {Code, Heading, Paragraph, Prose, TypographyRoot} from "./typography.tsx";

/* -------------------------------------------------------------------------------------------------
 * Compound Component
 * -----------------------------------------------------------------------------------------------*/
export const Typography = Object.assign(TypographyRoot, {
  Code,
  Heading,
  Paragraph,
  Prose,
  Root: TypographyRoot,
});

export type Typography = {
  CodeProps: ComponentProps<typeof Code>;
  HeadingProps: ComponentProps<typeof Heading>;
  ParagraphProps: ComponentProps<typeof Paragraph>;
  ProseProps: ComponentProps<typeof Prose>;
  Props: ComponentProps<typeof TypographyRoot>;
  RootProps: ComponentProps<typeof TypographyRoot>;
};

/* -------------------------------------------------------------------------------------------------
 * Named Component
 * -----------------------------------------------------------------------------------------------*/
export {Code, Heading, Paragraph, Prose, TypographyRoot};

export type {
  CodeProps,
  HeadingProps,
  ParagraphProps,
  ProseProps,
  TypographyRootProps,
  TypographyRootProps as TypographyProps,
} from "./typography.tsx";

/* -------------------------------------------------------------------------------------------------
 * Variants
 * -----------------------------------------------------------------------------------------------*/
export {typographyVariants} from "@peakui/styles";

export type {TypographyVariants} from "@peakui/styles";

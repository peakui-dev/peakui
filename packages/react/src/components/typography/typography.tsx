"use client";

import type {TypographyVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {typographyVariants} from "@peakui/styles";
import {Text as TextPrimitive} from "react-aria-components/Text";

import {composeSlotClassName} from "../../utils/compose.ts";

type TypographyType = NonNullable<TypographyVariants["type"]>;
type TypographyAlign = NonNullable<TypographyVariants["align"]>;
type TypographyColor = NonNullable<TypographyVariants["color"]>;
type TypographyWeight = NonNullable<TypographyVariants["weight"]>;

/* The element a type renders: a heading type a heading, a body type a paragraph. */
const defaultElementByType: Record<TypographyType, string> = {
  body: "p",
  "body-sm": "p",
  "body-xs": "p",
  code: "code",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
};

/* -------------------------------------------------------------------------------------------------
 * Typography Root
 * -----------------------------------------------------------------------------------------------*/
interface TypographyRootProps extends Omit<
  ComponentPropsWithRef<typeof TextPrimitive>,
  "className" | "elementType"
> {
  align?: TypographyAlign;
  children?: ReactNode;
  className?: string;
  color?: TypographyColor;
  truncate?: boolean;
  type?: TypographyType;
  weight?: TypographyWeight;
}

const TypographyRoot = ({
  align = "start",
  children,
  className,
  color = "default",
  truncate,
  type = "body",
  weight,
  ...props
}: TypographyRootProps) => {
  const slots = typographyVariants({align, color, truncate, type, weight});

  return (
    <TextPrimitive
      className={composeSlotClassName(slots.base, className)}
      data-type={type}
      elementType={defaultElementByType[type]}
      {...props}
      data-slot="typography"
    >
      {children}
    </TextPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Typography Heading
 * -----------------------------------------------------------------------------------------------*/
interface HeadingProps extends Omit<TypographyRootProps, "type"> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

const Heading = ({level = 1, ...props}: HeadingProps) => {
  return <TypographyRoot type={`h${level}`} {...props} />;
};

/* -------------------------------------------------------------------------------------------------
 * Typography Paragraph
 * -----------------------------------------------------------------------------------------------*/
interface ParagraphProps extends Omit<TypographyRootProps, "type"> {
  size?: "base" | "sm" | "xs";
}

const Paragraph = ({size = "base", ...props}: ParagraphProps) => {
  return <TypographyRoot type={size === "base" ? "body" : `body-${size}`} {...props} />;
};

/* -------------------------------------------------------------------------------------------------
 * Typography Code
 * -----------------------------------------------------------------------------------------------*/
type CodeProps = Omit<TypographyRootProps, "type">;

const Code = (props: CodeProps) => {
  return <TypographyRoot type="code" {...props} />;
};

/* -------------------------------------------------------------------------------------------------
 * Typography Prose
 * -----------------------------------------------------------------------------------------------*/
interface ProseProps extends Omit<ComponentPropsWithRef<"div">, "color"> {
  children: ReactNode;
}

const Prose = ({children, className, ...props}: ProseProps) => {
  const slots = typographyVariants();

  return (
    <div className={composeSlotClassName(slots.prose, className)} {...props} data-slot="prose">
      {children}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {Code, Heading, Paragraph, Prose, TypographyRoot};

export type {CodeProps, HeadingProps, ParagraphProps, ProseProps, TypographyRootProps};

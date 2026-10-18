"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {BadgeVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {badgeVariants} from "@peakui/styles";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Badge Context
 * -----------------------------------------------------------------------------------------------*/
interface BadgeContext {
  slots?: ReturnType<typeof badgeVariants>;
}

const BadgeContext = createContext<BadgeContext>({});

/* -------------------------------------------------------------------------------------------------
 * Badge Anchor
 * -----------------------------------------------------------------------------------------------*/
interface BadgeAnchorProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
}

const BadgeAnchor = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: BadgeAnchorProps<E> & Omit<JSX.IntrinsicElements[E], keyof BadgeAnchorProps<E>>) => {
  return (
    <dom.span
      className={composeSlotClassName(badgeVariants().anchor, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="badge-anchor"
    >
      {children}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Badge Root
 * -----------------------------------------------------------------------------------------------*/
interface BadgeRootProps<E extends keyof JSX.IntrinsicElements = "span">
  extends DOMRenderProps<E, undefined>, BadgeVariants {
  children?: ReactNode;
  className?: string;
}

const BadgeRoot = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  color,
  placement,
  size,
  variant,
  ...props
}: BadgeRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof BadgeRootProps<E>>) => {
  const slots = React.useMemo(
    () => badgeVariants({color, placement, size, variant}),
    [color, placement, size, variant],
  );

  const contextValue = React.useMemo(() => ({slots}), [slots]);

  /* A string or a number is the badge's text; anything else is the consumer's own markup. */
  const content =
    typeof children === "string" || typeof children === "number" ? (
      <BadgeLabel>{children}</BadgeLabel>
    ) : (
      children
    );

  return (
    <BadgeContext value={contextValue}>
      <dom.span
        className={composeSlotClassName(slots.base, className)}
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        data-slot="badge"
      >
        {content}
      </dom.span>
    </BadgeContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Badge Label
 * -----------------------------------------------------------------------------------------------*/
interface BadgeLabelProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const BadgeLabel = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: BadgeLabelProps<E> & Omit<JSX.IntrinsicElements[E], keyof BadgeLabelProps<E>>) => {
  const {slots} = use(BadgeContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.label, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="badge-label"
    >
      {children}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {BadgeRoot, BadgeLabel, BadgeAnchor};

export type {BadgeRootProps, BadgeLabelProps, BadgeAnchorProps};

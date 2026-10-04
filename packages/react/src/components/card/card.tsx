"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {CardVariants, SurfaceVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {cardVariants} from "@peakui/styles";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Card Context
 * -----------------------------------------------------------------------------------------------*/
interface CardContext {
  slots?: ReturnType<typeof cardVariants>;
}

const CardContext = createContext<CardContext>({});

/* -------------------------------------------------------------------------------------------------
 * Card Root
 * -----------------------------------------------------------------------------------------------*/
interface CardRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
  /** Visual variant. @default "default" */
  variant?: CardVariants["variant"];
}

const CardRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  variant = "default",
  ...props
}: CardRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardRootProps<E>>) => {
  const slots = React.useMemo(() => cardVariants({variant}), [variant]);
  const contextValue = React.useMemo(() => ({slots}), [slots]);
  const surfaceContextValue = React.useMemo(
    () => ({variant: variant as SurfaceVariants["variant"]}),
    [variant],
  );

  const content = (
    <dom.div
      className={slots.base({className})}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card"
    >
      {children}
    </dom.div>
  );

  return (
    <CardContext value={contextValue}>
      {variant === "transparent" ? (
        content
      ) : (
        // Allows inner components to apply "on-surface" colors for proper contrast
        <SurfaceContext value={surfaceContextValue}>{content}</SurfaceContext>
      )}
    </CardContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Card Header
 * -----------------------------------------------------------------------------------------------*/
interface CardHeaderProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const CardHeader = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  ...props
}: CardHeaderProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardHeaderProps<E>>) => {
  const {slots} = use(CardContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.header, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card-header"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Card Title
 * -----------------------------------------------------------------------------------------------*/
interface CardTitleProps<E extends keyof JSX.IntrinsicElements = "h3"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const CardTitle = <E extends keyof JSX.IntrinsicElements = "h3">({
  children,
  className,
  ...props
}: CardTitleProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardTitleProps<E>>) => {
  const {slots} = use(CardContext);

  return (
    <dom.h3
      className={composeSlotClassName(slots?.title, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card-title"
    >
      {children}
    </dom.h3>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Card Description
 * -----------------------------------------------------------------------------------------------*/
interface CardDescriptionProps<E extends keyof JSX.IntrinsicElements = "p"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const CardDescription = <E extends keyof JSX.IntrinsicElements = "p">({
  children,
  className,
  ...props
}: CardDescriptionProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardDescriptionProps<E>>) => {
  const {slots} = use(CardContext);

  return (
    <dom.p
      className={composeSlotClassName(slots?.description, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card-description"
    >
      {children}
    </dom.p>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Card Content
 * -----------------------------------------------------------------------------------------------*/
interface CardContentProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const CardContent = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  ...props
}: CardContentProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardContentProps<E>>) => {
  const {slots} = use(CardContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.content, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card-content"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Card Footer
 * -----------------------------------------------------------------------------------------------*/
interface CardFooterProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const CardFooter = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  ...props
}: CardFooterProps<E> & Omit<JSX.IntrinsicElements[E], keyof CardFooterProps<E>>) => {
  const {slots} = use(CardContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.footer, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="card-footer"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {CardRoot, CardHeader, CardTitle, CardDescription, CardContent, CardFooter};

export type {
  CardRootProps,
  CardHeaderProps,
  CardTitleProps,
  CardDescriptionProps,
  CardContentProps,
  CardFooterProps,
};

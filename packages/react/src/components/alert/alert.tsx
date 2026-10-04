"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {AlertVariants, SurfaceVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {alertVariants} from "@peakui/styles";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {DangerIcon, InfoIcon, SuccessIcon, WarningIcon} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Alert Context
 * -----------------------------------------------------------------------------------------------*/
type AlertContext = {
  slots?: ReturnType<typeof alertVariants>;
  status?: AlertVariants["status"];
};

const AlertContext = createContext<AlertContext>({});

const DEFAULT_SURFACE_CONTEXT = {variant: "default" as SurfaceVariants["variant"]};

/* -------------------------------------------------------------------------------------------------
 * Alert Root
 * -----------------------------------------------------------------------------------------------*/
interface AlertRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
  /** Alert status. */
  status?: AlertVariants["status"];
}

const AlertRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  status,
  ...rest
}: AlertRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof AlertRootProps<E>>) => {
  const slots = React.useMemo(() => alertVariants({status}), [status]);
  const contextValue = React.useMemo(() => ({slots, status}), [slots, status]);

  return (
    <AlertContext value={contextValue}>
      <SurfaceContext value={DEFAULT_SURFACE_CONTEXT}>
        <dom.div
          className={slots?.base({className})}
          /*
           * The permitted `any`: the element type is a parameter, and the spread has erased it.
           * references/typescript.md, the polymorphic spread boundary.
           */
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(rest as any)}
          data-slot="alert-root"
        >
          {children}
        </dom.div>
      </SurfaceContext>
    </AlertContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Alert Indicator
 * -----------------------------------------------------------------------------------------------*/
interface AlertIndicatorProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const AlertIndicator = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...rest
}: AlertIndicatorProps<E> & Omit<JSX.IntrinsicElements[E], keyof AlertIndicatorProps<E>>) => {
  const {slots, status} = use(AlertContext);

  // Map status to default icons
  const getDefaultIcon = () => {
    switch (status) {
      case "accent":
        return <InfoIcon data-slot="alert-default-icon" />;
      case "success":
        return <SuccessIcon data-slot="alert-default-icon" />;
      case "warning":
        return <WarningIcon data-slot="alert-default-icon" />;
      case "danger":
        return <DangerIcon data-slot="alert-default-icon" />;
      default:
        return <InfoIcon data-slot="alert-default-icon" />;
    }
  };

  return (
    <dom.div
      className={composeSlotClassName(slots?.indicator, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="alert-indicator"
    >
      {children ?? getDefaultIcon()}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Alert Content
 * -----------------------------------------------------------------------------------------------*/
interface AlertContentProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const AlertContent = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...rest
}: AlertContentProps<E> & Omit<JSX.IntrinsicElements[E], keyof AlertContentProps<E>>) => {
  const {slots} = use(AlertContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.content, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="alert-content"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Alert Title
 * -----------------------------------------------------------------------------------------------*/
interface AlertTitleProps<E extends keyof JSX.IntrinsicElements = "p"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const AlertTitle = <E extends keyof JSX.IntrinsicElements = "p">({
  children,
  className,
  ...rest
}: AlertTitleProps<E> & Omit<JSX.IntrinsicElements[E], keyof AlertTitleProps<E>>) => {
  const {slots} = use(AlertContext);

  return (
    <dom.p
      className={composeSlotClassName(slots?.title, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="alert-title"
    >
      {children}
    </dom.p>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Alert Description
 * -----------------------------------------------------------------------------------------------*/
interface AlertDescriptionProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AlertDescription = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...rest
}: AlertDescriptionProps<E> & Omit<JSX.IntrinsicElements[E], keyof AlertDescriptionProps<E>>) => {
  const {slots} = use(AlertContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.description, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(rest as any)}
      data-slot="alert-description"
    >
      {children}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {AlertRoot, AlertIndicator, AlertContent, AlertTitle, AlertDescription};

export type {
  AlertRootProps,
  AlertIndicatorProps,
  AlertContentProps,
  AlertTitleProps,
  AlertDescriptionProps,
};

"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SwitchVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {SwitchButtonRenderProps, SwitchFieldRenderProps} from "react-aria-components/Switch";

import {switchVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {LabelContext} from "react-aria-components/Label";
import {
  SwitchButton as SwitchButtonPrimitive,
  SwitchField as SwitchFieldPrimitive,
} from "react-aria-components/Switch";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* The label inside Switch.Content renders as a span: the clickable SwitchButton is the label. */
const LABEL_SPAN_CONTEXT = {elementType: "span" as const};

interface SwitchContextValue {
  slots?: ReturnType<typeof switchVariants>;
  state?: SwitchFieldRenderProps;
}

const SwitchContext = createContext<SwitchContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * Switch (Field) — React Aria `SwitchField`.
 * -----------------------------------------------------------------------------------------------*/
interface SwitchRootProps
  extends ComponentPropsWithRef<typeof SwitchFieldPrimitive>, SwitchVariants {}

const SwitchRoot = ({children, className, size, ...props}: SwitchRootProps) => {
  const slots = React.useMemo(() => switchVariants({size}), [size]);

  return (
    <SwitchFieldPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="switch"
    >
      {(state) => (
        <SwitchContext value={{slots, state}}>
          {typeof children === "function" ? children(state) : children}
        </SwitchContext>
      )}
    </SwitchFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Switch.Content — the clickable `SwitchButton` label wrapping the control + `Label`.
 * Keep `Description`/`FieldError` as siblings of `Switch.Content`.
 * -----------------------------------------------------------------------------------------------*/
interface SwitchContentProps extends ComponentPropsWithRef<typeof SwitchButtonPrimitive> {}

const SwitchContent = ({children, className, ...props}: SwitchContentProps) => {
  const {slots} = use(SwitchContext);

  return (
    <SwitchButtonPrimitive
      className={composeTwRenderProps(className, slots?.content())}
      {...props}
      data-slot="switch-content"
    >
      {(state) => (
        <LabelContext value={LABEL_SPAN_CONTEXT}>
          {typeof children === "function" ? children(state) : children}
        </LabelContext>
      )}
    </SwitchButtonPrimitive>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface SwitchControlProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const SwitchControl = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: SwitchControlProps<E> & Omit<JSX.IntrinsicElements[E], keyof SwitchControlProps<E>>) => {
  const {slots} = use(SwitchContext);

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      className={composeSlotClassName(slots?.control, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="switch-control"
    >
      {children}
    </dom.span>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface SwitchThumbProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const SwitchThumb = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: SwitchThumbProps<E> & Omit<JSX.IntrinsicElements[E], keyof SwitchThumbProps<E>>) => {
  const {slots} = use(SwitchContext);

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      className={composeSlotClassName(slots?.thumb, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="switch-thumb"
    >
      {children}
    </dom.span>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface SwitchIconProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const SwitchIcon = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: SwitchIconProps<E> & Omit<JSX.IntrinsicElements[E], keyof SwitchIconProps<E>>) => {
  const {slots} = use(SwitchContext);

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      className={composeSlotClassName(slots?.icon, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="switch-icon"
    >
      {children}
    </dom.span>
  );
};

/* ----------------------------------------------------------------------------------------------*/
export {SwitchContent, SwitchControl, SwitchIcon, SwitchRoot, SwitchThumb};
export type {
  SwitchRootProps,
  SwitchContentProps,
  SwitchControlProps,
  SwitchThumbProps,
  SwitchIconProps,
  SwitchFieldRenderProps,
  SwitchButtonRenderProps,
};

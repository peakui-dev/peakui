"use client";

import type {Booleanish} from "../../utils/assertion.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {AccordionVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {accordionVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Button} from "react-aria-components/Button";
import {
  DisclosurePanel,
  Disclosure as DisclosurePrimitive,
  DisclosureStateContext,
} from "react-aria-components/Disclosure";
import {DisclosureGroup as DisclosureGroupPrimitive} from "react-aria-components/DisclosureGroup";
import {Heading as DisclosureHeadingPrimitive} from "react-aria-components/Heading";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconChevronDown} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Accordion Context
 * -----------------------------------------------------------------------------------------------*/
type AccordionContext = {
  slots?: ReturnType<typeof accordionVariants>;
  hideSeparator?: boolean;
};

const AccordionContext = createContext<AccordionContext>({});

const SURFACE_CONTEXT_VALUE = {variant: "default" as const};

/* -------------------------------------------------------------------------------------------------
 * Accordion Root
 * -----------------------------------------------------------------------------------------------*/
interface AccordionRootProps
  extends ComponentPropsWithRef<typeof DisclosureGroupPrimitive>, AccordionVariants {
  /** Hides the line between items. @default false */
  hideSeparator?: boolean;
}

const AccordionRoot = ({
  children,
  className,
  hideSeparator = false,
  variant,
  ...props
}: AccordionRootProps) => {
  const slots = React.useMemo(() => accordionVariants({variant}), [variant]);
  const contextValue = React.useMemo(() => ({hideSeparator, slots}), [hideSeparator, slots]);

  const group = (
    <DisclosureGroupPrimitive
      {...props}
      className={composeTwRenderProps(className, slots.base())}
      data-slot="accordion"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </DisclosureGroupPrimitive>
  );

  return (
    <AccordionContext value={contextValue}>
      {variant === "surface" ? (
        // Lets nested controls re-base their fills against the surface.
        <SurfaceContext value={SURFACE_CONTEXT_VALUE}>{group}</SurfaceContext>
      ) : (
        group
      )}
    </AccordionContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Item
 * -----------------------------------------------------------------------------------------------*/
interface AccordionItemProps extends ComponentPropsWithRef<typeof DisclosurePrimitive> {}

const AccordionItem = ({className, ...props}: AccordionItemProps) => {
  const {hideSeparator, slots} = use(AccordionContext);

  return (
    <DisclosurePrimitive
      className={composeTwRenderProps(className, slots?.item())}
      data-hide-separator={hideSeparator ? "true" : undefined}
      {...props}
      data-slot="accordion-item"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Heading
 * -----------------------------------------------------------------------------------------------*/
interface AccordionHeadingProps extends ComponentPropsWithRef<typeof DisclosureHeadingPrimitive> {
  className?: string;
}

const AccordionHeading = ({className, ...props}: AccordionHeadingProps) => {
  const {slots} = use(AccordionContext);

  return (
    <DisclosureHeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      {...props}
      data-slot="accordion-heading"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Trigger
 * -----------------------------------------------------------------------------------------------*/
interface AccordionTriggerProps extends ComponentPropsWithRef<typeof Button> {}

const AccordionTrigger = ({children, className, ...props}: AccordionTriggerProps) => {
  const {slots} = use(AccordionContext);

  return (
    <Button
      className={composeTwRenderProps(className, slots?.trigger())}
      slot="trigger"
      {...props}
      data-slot="accordion-trigger"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </Button>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Panel
 * -----------------------------------------------------------------------------------------------*/
interface AccordionPanelProps extends ComponentPropsWithRef<typeof DisclosurePanel> {}

const AccordionPanel = ({children, className, ...props}: AccordionPanelProps) => {
  const {slots} = use(AccordionContext);
  const {isExpanded} = use(DisclosureStateContext)!;

  return (
    <DisclosurePanel
      className={composeTwRenderProps(className, slots?.panel())}
      data-expanded={dataAttr(isExpanded)}
      {...props}
      data-slot="accordion-panel"
    >
      {children}
    </DisclosurePanel>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Body
 * -----------------------------------------------------------------------------------------------*/
interface AccordionBodyProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AccordionBody = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: AccordionBodyProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof AccordionBodyProps<E>>) => {
  const {slots} = use(AccordionContext);

  return (
    <dom.div
      className={slots?.body({})}
      /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="accordion-body"
    >
      <div
        className={composeSlotClassName(slots?.bodyInner, className)}
        data-slot="accordion-body-inner"
      >
        {children}
      </div>
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Accordion Indicator
 * -----------------------------------------------------------------------------------------------*/
interface AccordionIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AccordionIndicator = <E extends keyof React.JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: AccordionIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AccordionIndicatorProps<E>>) => {
  const {slots} = use(AccordionContext);
  const {isExpanded} = use(DisclosureStateContext)!;

  if (children && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        className?: string;
        "data-slot"?: "accordion-indicator";
        "data-expanded"?: Booleanish;
      }>,
      {
        /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(props as any),
        "data-expanded": dataAttr(isExpanded),
        className: composeSlotClassName(slots?.indicator, className),
        "data-slot": "accordion-indicator",
      },
    );
  }

  return (
    <IconChevronDown
      className={composeSlotClassName(slots?.indicator, className)}
      data-expanded={dataAttr(isExpanded)}
      /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="accordion-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  AccordionRoot,
  AccordionItem,
  AccordionHeading,
  AccordionTrigger,
  AccordionPanel,
  AccordionIndicator,
  AccordionBody,
};

export type {
  AccordionRootProps,
  AccordionItemProps,
  AccordionHeadingProps,
  AccordionTriggerProps,
  AccordionPanelProps,
  AccordionIndicatorProps,
  AccordionBodyProps,
};

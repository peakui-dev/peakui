"use client";

import type {Booleanish} from "../../utils/assertion.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {DisclosureVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {ButtonProps} from "react-aria-components/Button";

import {disclosureVariants} from "@peakui/styles";
import React, {createContext, use, useRef} from "react";
import {Button} from "react-aria-components/Button";
import {
  DisclosurePanel,
  Disclosure as DisclosurePrimitive,
  DisclosureStateContext,
} from "react-aria-components/Disclosure";
import {Heading as DisclosureHeadingPrimitive} from "react-aria-components/Heading";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconChevronDown} from "../icons.tsx";

/* ------------------------------------------------------------------------------------------------
 * Disclosure Context
 * --------------------------------------------------------------------------------------------- */
type DisclosureContext = {
  slots?: ReturnType<typeof disclosureVariants>;
};

const DisclosureContext = createContext<DisclosureContext>({});

/* -------------------------------------------------------------------------------------------------
 * Disclosure Root
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureRootProps
  extends ComponentPropsWithRef<typeof DisclosurePrimitive>, DisclosureVariants {}

const DisclosureRoot = ({children, className, ...props}: DisclosureRootProps) => {
  const slots = React.useMemo(() => disclosureVariants({}), []);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <DisclosureContext value={contextValue}>
      <DisclosurePrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="disclosure"
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </DisclosurePrimitive>
    </DisclosureContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Disclosure Heading
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureHeadingProps extends ComponentPropsWithRef<typeof DisclosureHeadingPrimitive> {
  className?: string;
}

const DisclosureHeading = ({className, ...props}: DisclosureHeadingProps) => {
  const {slots} = use(DisclosureContext);

  return (
    <DisclosureHeadingPrimitive
      className={composeSlotClassName(slots?.heading, className)}
      {...props}
      data-slot="disclosure-heading"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Disclosure Trigger
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureTriggerProps extends ButtonProps {}

const DisclosureTrigger = ({children, className, ...props}: DisclosureTriggerProps) => {
  const {slots} = use(DisclosureContext);

  return (
    <Button
      className={composeTwRenderProps(className, slots?.trigger())}
      slot="trigger"
      {...props}
      data-slot="disclosure-trigger"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </Button>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Disclosure Content
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureContentProps extends ComponentPropsWithRef<typeof DisclosurePanel> {}

const DisclosureContent = ({children, className, ...props}: DisclosureContentProps) => {
  const {slots} = use(DisclosureContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const {isExpanded} = use(DisclosureStateContext)!;

  return (
    <DisclosurePanel
      ref={contentRef}
      className={composeTwRenderProps(className, slots?.content())}
      data-expanded={dataAttr(isExpanded)}
      {...props}
      data-slot="disclosure-content"
    >
      {children}
    </DisclosurePanel>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Disclosure Body
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureBodyContentProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DisclosureBody = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DisclosureBodyContentProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof DisclosureBodyContentProps<E>>) => {
  const {slots} = use(DisclosureContext);

  return (
    <dom.div
      className={slots?.body({})}
      /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="disclosure-body"
    >
      {/* Body inner carries no consumer props: className lands on it by the reference's contract. */}
      <div
        className={composeSlotClassName(slots?.bodyInner, className)}
        data-slot="disclosure-body-inner"
      >
        {children}
      </div>
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Disclosure Indicator
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DisclosureIndicator = <E extends keyof React.JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: DisclosureIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof DisclosureIndicatorProps<E>>) => {
  const {isExpanded} = use(DisclosureStateContext)!;
  const {slots} = use(DisclosureContext);

  if (children && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        className?: string;
        "data-slot"?: "disclosure-indicator";
        "data-expanded"?: Booleanish;
      }>,
      {
        /* The permitted `any`: the element type is a parameter, and the spread has erased it. */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(props as any),
        "data-expanded": dataAttr(isExpanded),
        className: composeSlotClassName(slots?.indicator, className),
        "data-slot": "disclosure-indicator",
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
      data-slot="disclosure-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DisclosureRoot,
  DisclosureHeading,
  DisclosureTrigger,
  DisclosureContent,
  DisclosureBody,
  DisclosureIndicator,
};

export type {
  DisclosureRootProps,
  DisclosureContentProps,
  DisclosureHeadingProps,
  DisclosureTriggerProps,
  DisclosureIndicatorProps,
  DisclosureBodyContentProps,
};

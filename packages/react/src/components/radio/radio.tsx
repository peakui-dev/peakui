"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {RadioButtonRenderProps, RadioFieldRenderProps} from "react-aria-components/RadioGroup";

import {radioVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {LabelContext} from "react-aria-components/Label";
import {
  RadioButton as RadioButtonPrimitive,
  RadioField as RadioFieldPrimitive,
} from "react-aria-components/RadioGroup";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* The label inside Radio.Content renders as a span: the clickable RadioButton is the label. */
const LABEL_SPAN_CONTEXT = {elementType: "span" as const};

interface RadioContextValue {
  slots?: ReturnType<typeof radioVariants>;
  state?: RadioFieldRenderProps;
}

const RadioContext = createContext<RadioContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * Radio (Field) — React Aria `RadioField`.
 * -----------------------------------------------------------------------------------------------*/
interface RadioRootProps extends ComponentPropsWithRef<typeof RadioFieldPrimitive> {
  /** The name of the radio button, used when submitting an HTML form. */
  name?: string;
}

const RadioRoot = ({children, className, ...props}: RadioRootProps) => {
  const slots = React.useMemo(() => radioVariants(), []);

  return (
    <RadioFieldPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="radio"
    >
      {(state) => (
        <RadioContext value={{slots, state}}>
          {typeof children === "function" ? children(state) : children}
        </RadioContext>
      )}
    </RadioFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Radio.Content — the clickable `RadioButton` label wrapping the control + `Label`.
 * Keep `Description`/`FieldError` as siblings of `Radio.Content`.
 * -----------------------------------------------------------------------------------------------*/
interface RadioContentProps extends ComponentPropsWithRef<typeof RadioButtonPrimitive> {}

const RadioContent = ({children, className, ...props}: RadioContentProps) => {
  const {slots} = use(RadioContext);

  return (
    <RadioButtonPrimitive
      className={composeTwRenderProps(className, slots?.content())}
      {...props}
      data-slot="radio-content"
    >
      {(state) => (
        <LabelContext value={LABEL_SPAN_CONTEXT}>
          {typeof children === "function" ? children(state) : children}
        </LabelContext>
      )}
    </RadioButtonPrimitive>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface RadioControlProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const RadioControl = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: RadioControlProps<E> & Omit<JSX.IntrinsicElements[E], keyof RadioControlProps<E>>) => {
  const {slots} = use(RadioContext);

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      className={composeSlotClassName(slots?.control, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="radio-control"
    >
      {children}
    </dom.span>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface RadioIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode | ((props: RadioFieldRenderProps) => ReactNode);
  className?: string;
}

const RadioIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: RadioIndicatorProps<E> & Omit<JSX.IntrinsicElements[E], keyof RadioIndicatorProps<E>>) => {
  const {slots, state} = use(RadioContext);

  const content =
    typeof children === "function" ? children(state ?? ({} as RadioFieldRenderProps)) : children;

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="radio-indicator"
    >
      {content}
    </dom.span>
  );
};

/* ----------------------------------------------------------------------------------------------*/
export {RadioContent, RadioControl, RadioIndicator, RadioRoot};
export type {
  RadioRootProps,
  RadioContentProps,
  RadioControlProps,
  RadioIndicatorProps,
  RadioFieldRenderProps,
  RadioButtonRenderProps,
};

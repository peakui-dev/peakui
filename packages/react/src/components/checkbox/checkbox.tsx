"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {CheckboxVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {
  CheckboxButtonRenderProps,
  CheckboxFieldRenderProps,
} from "react-aria-components/Checkbox";

import {checkboxVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {
  CheckboxButton as CheckboxButtonPrimitive,
  CheckboxField as CheckboxFieldPrimitive,
} from "react-aria-components/Checkbox";
import {LabelContext} from "react-aria-components/Label";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {CheckboxGroupContext} from "../checkbox-group/checkbox-group-context.ts";

/* The label inside Checkbox.Content renders as a span: the clickable CheckboxButton is the label. */
const LABEL_SPAN_CONTEXT = {elementType: "span" as const};

interface CheckboxContextValue {
  slots?: ReturnType<typeof checkboxVariants>;
  state?: CheckboxFieldRenderProps;
}

const CheckboxContext = createContext<CheckboxContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * Checkbox (Field) — React Aria `CheckboxField`.
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxRootProps
  extends ComponentPropsWithRef<typeof CheckboxFieldPrimitive>, CheckboxVariants {
  /** The name of the checkbox, used when submitting an HTML form. */
  name?: string;
}

const CheckboxRoot = ({children, className, variant, ...props}: CheckboxRootProps) => {
  const checkboxGroupContext = use(CheckboxGroupContext);
  const effectiveVariant = variant ?? checkboxGroupContext.variant;
  const slots = React.useMemo(
    () => checkboxVariants({variant: effectiveVariant}),
    [effectiveVariant],
  );

  return (
    <CheckboxFieldPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="checkbox"
    >
      {(state) => (
        <CheckboxContext value={{slots, state}}>
          {typeof children === "function" ? children(state) : children}
        </CheckboxContext>
      )}
    </CheckboxFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Checkbox.Content — the clickable `CheckboxButton` label wrapping the control + `Label`.
 * Keep `Description`/`FieldError` as siblings of `Checkbox.Content`.
 * -----------------------------------------------------------------------------------------------*/
interface CheckboxContentProps extends ComponentPropsWithRef<typeof CheckboxButtonPrimitive> {}

const CheckboxContent = ({children, className, ...props}: CheckboxContentProps) => {
  const {slots} = use(CheckboxContext);

  return (
    <CheckboxButtonPrimitive
      className={composeTwRenderProps(className, slots?.content())}
      {...props}
      data-slot="checkbox-content"
    >
      {(state) => (
        <LabelContext value={LABEL_SPAN_CONTEXT}>
          {typeof children === "function" ? children(state) : children}
        </LabelContext>
      )}
    </CheckboxButtonPrimitive>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface CheckboxControlProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const CheckboxControl = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: CheckboxControlProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof CheckboxControlProps<E>>) => {
  const {slots} = use(CheckboxContext);

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      className={composeSlotClassName(slots?.control, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="checkbox-control"
    >
      {children}
    </dom.span>
  );
};

/* -----------------------------------------------------------------------------------------------*/
interface CheckboxIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode | ((props: CheckboxFieldRenderProps) => ReactNode);
  className?: string;
}

const CheckboxIndicator = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: CheckboxIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof CheckboxIndicatorProps<E>>) => {
  const {slots, state} = use(CheckboxContext);

  const isSelected = state?.isSelected;
  const isIndeterminate = state?.isIndeterminate;

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as CheckboxFieldRenderProps))
    ) : children ? (
      children
    ) : isIndeterminate ? (
      <svg
        aria-hidden="true"
        data-slot="checkbox-default-indicator--indeterminate"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth={3}
        viewBox="0 0 24 24"
      >
        <line x1="21" x2="3" y1="12" y2="12" />
      </svg>
    ) : (
      <svg
        aria-hidden="true"
        data-slot="checkbox-default-indicator--checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeDasharray={22}
        strokeDashoffset={isSelected ? 44 : 66}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        viewBox="0 0 17 18"
      >
        <polyline points="1 9 7 14 15 4" />
      </svg>
    );

  /* Without `render` the base element is a span; the E parameter only widens the render prop. */
  return (
    <dom.span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator, className)}
      {...(props as DOMRenderProps<"span", undefined> & JSX.IntrinsicElements["span"])}
      data-slot="checkbox-indicator"
    >
      {content}
    </dom.span>
  );
};

/* ----------------------------------------------------------------------------------------------*/
export {CheckboxContent, CheckboxControl, CheckboxIndicator, CheckboxRoot};
export type {
  CheckboxRootProps,
  CheckboxContentProps,
  CheckboxControlProps,
  CheckboxIndicatorProps,
  CheckboxFieldRenderProps,
  CheckboxButtonRenderProps,
};

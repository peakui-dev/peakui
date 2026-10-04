"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ListBoxItemVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {ListBoxItemRenderProps} from "react-aria-components/ListBox";

import {listBoxItemVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {ListBoxItem as ListBoxItemPrimitive} from "react-aria-components/ListBox";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Context
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemContext {
  slots?: ReturnType<typeof listBoxItemVariants>;
  state?: ListBoxItemRenderProps;
}

const ListBoxItemContext = createContext<ListBoxItemContext>({});

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Root
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemRootProps
  extends ComponentPropsWithRef<typeof ListBoxItemPrimitive>, ListBoxItemVariants {
  className?: string;
}

const ListBoxItemRoot = ({children, className, variant, ...props}: ListBoxItemRootProps) => {
  const slots = React.useMemo(() => listBoxItemVariants({variant}), [variant]);

  return (
    <ListBoxItemPrimitive
      className={composeTwRenderProps(className, slots.item())}
      {...props}
      data-slot="list-box-item"
    >
      {(values) => (
        <ListBoxItemContext value={{slots, state: values}}>
          {typeof children === "function" ? children(values) : children}
        </ListBoxItemContext>
      )}
    </ListBoxItemPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ListBox Item Indicator
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxItemIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: React.ReactNode | ((props: ListBoxItemRenderProps) => React.ReactNode);
  className?: string;
}

const ListBoxItemIndicator = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: ListBoxItemIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof ListBoxItemIndicatorProps<E>>) => {
  const {slots, state} = use(ListBoxItemContext);
  const isSelected = state?.isSelected;

  const content =
    typeof children === "function" ? (
      children(state ?? ({} as ListBoxItemRenderProps))
    ) : children ? (
      children
    ) : (
      <svg
        aria-hidden="true"
        data-slot="list-box-item-indicator--checkmark"
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

  return (
    <dom.span
      aria-hidden="true"
      className={composeSlotClassName(slots?.indicator, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="list-box-item-indicator"
      data-visible={isSelected || undefined}
    >
      {content}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxItemRoot, ListBoxItemIndicator};

export type {ListBoxItemRootProps, ListBoxItemIndicatorProps};

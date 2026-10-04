"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {JSX, ReactNode} from "react";

import {emptyStateVariants} from "@peakui/styles";

import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * EmptyState Root
 * -----------------------------------------------------------------------------------------------*/
interface EmptyStateRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const EmptyStateRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: EmptyStateRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof EmptyStateRootProps<E>>) => {
  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={emptyStateVariants({className})}
      data-slot="empty-state"
    >
      {/*
       * `||`, not `??`, as in the reference: an empty-string children falls back too, so the
       * block never renders visibly empty. The default is the string the component itself
       * generates; consumer children always win.
       */}
      {children || "No results found"}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {EmptyStateRoot};

export type {EmptyStateRootProps};

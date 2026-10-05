"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SwitchGroupVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {switchGroupVariants} from "@peakui/styles";
import React from "react";

import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Switch Group Root — a presentational grouping; each Switch keeps its own state.
 * -----------------------------------------------------------------------------------------------*/
interface SwitchGroupRootProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
  /** Layout orientation. */
  orientation?: SwitchGroupVariants["orientation"];
}

const SwitchGroupRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  orientation,
  ...props
}: SwitchGroupRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof SwitchGroupRootProps<E>>) => {
  const slots = React.useMemo(() => switchGroupVariants({orientation}), [orientation]);

  /* Without `render` the base element is a div; the E parameter only widens the render prop. */
  return (
    <dom.div
      className={slots.base({className})}
      {...(props as DOMRenderProps<"div", undefined> & JSX.IntrinsicElements["div"])}
      data-slot="switch-group"
    >
      <dom.div className={slots.items()} data-slot="switch-group-items">
        {children}
      </dom.div>
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SwitchGroupRoot};

export type {SwitchGroupRootProps};

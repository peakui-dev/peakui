"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ChipVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {chipVariants} from "@peakui/styles";
import React, {createContext, use} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Chip Context
 * -----------------------------------------------------------------------------------------------*/
type ChipContext = {
  slots?: ReturnType<typeof chipVariants>;
};

const ChipContext = createContext<ChipContext>({});

/* -------------------------------------------------------------------------------------------------
 * Chip Root
 * -----------------------------------------------------------------------------------------------*/
interface ChipRootProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
  /** Chip color. */
  color?: ChipVariants["color"];
  /** Chip size. */
  size?: ChipVariants["size"];
  /** Chip variant. */
  variant?: ChipVariants["variant"];
}

const ChipRoot = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  color,
  size,
  variant,
  ...props
}: ChipRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof ChipRootProps<E>>) => {
  const slots = React.useMemo(() => chipVariants({color, size, variant}), [color, size, variant]);

  const chipChildren = React.useMemo(() => {
    if (typeof children === "string" || typeof children === "number") {
      return <ChipLabel>{children}</ChipLabel>;
    }

    return children;
  }, [children]);

  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <ChipContext value={contextValue}>
      <dom.span
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        className={composeSlotClassName(slots.base, className)}
        data-slot="chip"
      >
        {chipChildren}
      </dom.span>
    </ChipContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Chip Label
 * -----------------------------------------------------------------------------------------------*/
interface ChipLabelProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const ChipLabel = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: ChipLabelProps<E> & Omit<JSX.IntrinsicElements[E], keyof ChipLabelProps<E>>) => {
  const {slots} = use(ChipContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.label, className)}
      data-slot="chip-label"
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      {children}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ChipRoot, ChipLabel};

export type {ChipRootProps, ChipLabelProps};

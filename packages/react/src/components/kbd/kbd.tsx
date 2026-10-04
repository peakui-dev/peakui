"use client";

import type {KbdKey} from "./kbd.constants.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {KbdVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {kbdVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";

import {composeSlotClassName} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

import {kbdKeysLabelMap, kbdKeysMap} from "./kbd.constants.ts";

/* -------------------------------------------------------------------------------------------------
 * Kbd Context
 * -----------------------------------------------------------------------------------------------*/
type KbdContext = {
  slots?: ReturnType<typeof kbdVariants>;
};

const KbdContext = createContext<KbdContext>({});

/* -------------------------------------------------------------------------------------------------
 * Kbd Root
 * -----------------------------------------------------------------------------------------------*/
interface KbdRootProps<E extends keyof JSX.IntrinsicElements = "kbd"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
  /** Visual variant. */
  variant?: KbdVariants["variant"];
}

const KbdRoot = <E extends keyof JSX.IntrinsicElements = "kbd">({
  children,
  className,
  variant,
  ...props
}: KbdRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof KbdRootProps<E>>) => {
  const slots = useMemo(() => kbdVariants({variant}), [variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <KbdContext value={contextValue}>
      <dom.kbd
        data-slot="kbd"
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(props as any)}
        className={slots.base({className})}
      >
        {children}
      </dom.kbd>
    </KbdContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Kbd Abbr
 * -----------------------------------------------------------------------------------------------*/
interface KbdAbbrProps<E extends keyof JSX.IntrinsicElements = "abbr"> extends DOMRenderProps<
  E,
  undefined
> {
  className?: string;
  /** The keyboard key to display */
  keyValue: KbdKey;
}

const KbdAbbr = <E extends keyof JSX.IntrinsicElements = "abbr">({
  className,
  keyValue,
  ...props
}: KbdAbbrProps<E> & Omit<JSX.IntrinsicElements[E], keyof KbdAbbrProps<E>>) => {
  const {slots} = use(KbdContext);

  return (
    <dom.abbr
      className={composeSlotClassName(slots?.abbr, className)}
      data-slot="kbd-abbr"
      title={kbdKeysLabelMap[keyValue]}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
    >
      {kbdKeysMap[keyValue]}
    </dom.abbr>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Kbd Content
 * -----------------------------------------------------------------------------------------------*/
interface KbdContentProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
}

const KbdContent = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: KbdContentProps<E> & Omit<JSX.IntrinsicElements[E], keyof KbdContentProps<E>>) => {
  const {slots} = use(KbdContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.content, className)}
      data-slot="kbd-content"
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
export {KbdRoot, KbdAbbr, KbdContent};

export type {KbdRootProps, KbdAbbrProps, KbdContentProps};

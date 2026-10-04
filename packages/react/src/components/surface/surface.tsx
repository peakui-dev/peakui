"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SurfaceVariants} from "@peakui/styles";
import type {JSX, ReactNode} from "react";

import {surfaceVariants} from "@peakui/styles";
import {createContext, useMemo} from "react";

import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Surface Context
 * -------------------------------------------------------------------------------------------------
 * Consumers (card, accordion, …) provide this context to declare the ambient surface level;
 * nested controls read it to re-base their fills. A leaf with a context, not an assembled wrapper.
 * -----------------------------------------------------------------------------------------------*/
type SurfaceContext = {
  variant?: SurfaceVariants["variant"];
};

const SurfaceContext = createContext<SurfaceContext>({});

/* -------------------------------------------------------------------------------------------------
 * Surface Root
 * -----------------------------------------------------------------------------------------------*/
interface SurfaceRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children: ReactNode;
  className?: string;
  /** Visual variant. @default "default" */
  variant?: SurfaceVariants["variant"];
}

const SurfaceRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  variant = "default",
  ...rest
}: SurfaceRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof SurfaceRootProps<E>>) => {
  const contextValue = useMemo(() => ({variant}), [variant]);

  return (
    <SurfaceContext value={contextValue}>
      <dom.div
        className={surfaceVariants({variant, className})}
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(rest as any)}
        data-slot="surface"
      >
        {children}
      </dom.div>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SurfaceRoot, SurfaceContext};

export type {SurfaceRootProps};

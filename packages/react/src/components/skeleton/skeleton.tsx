"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SkeletonVariants} from "@peakui/styles";
import type {JSX} from "react";

import {skeletonVariants} from "@peakui/styles";
import {useMemo} from "react";

import {useCSSVariable} from "../../hooks/use-css-variable.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Skeleton Root
 * -----------------------------------------------------------------------------------------------*/
interface SkeletonRootProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  className?: string;
  /** Animation type; falls back to the `--skeleton-animation` variable when omitted. */
  animationType?: SkeletonVariants["animationType"];
}

const SkeletonRoot = <E extends keyof JSX.IntrinsicElements = "div">({
  animationType,
  className,
  ...props
}: SkeletonRootProps<E> & Omit<JSX.IntrinsicElements[E], keyof SkeletonRootProps<E>>) => {
  /*
   * `--skeleton-animation` on :root sets one default animation type for every Skeleton in an
   * app; the prop wins when given. The read is SSR-safe: useCSSVariable returns undefined
   * until hydration has finished, so the server and the first client render agree.
   */
  const resolvedAnimationType = useCSSVariable("--skeleton-animation", animationType);
  const slots = useMemo(
    () =>
      skeletonVariants({
        animationType: resolvedAnimationType as SkeletonVariants["animationType"],
      }),
    [resolvedAnimationType],
  );

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={slots.base({className})}
      data-slot="skeleton"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SkeletonRoot};

export type {SkeletonRootProps};

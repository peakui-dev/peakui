"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {TooltipVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {tooltipVariants} from "@peakui/styles";
import {mergeProps} from "@react-aria/utils";
import React, {createContext, use, useRef} from "react";
import {useFocusable} from "react-aria/useFocusable";
import {
  OverlayArrow,
  Tooltip as TooltipPrimitive,
  TooltipTrigger as TooltipTriggerPrimitive,
  TooltipTriggerStateContext,
} from "react-aria-components/Tooltip";

import {useCSSVariable} from "../../hooks/use-css-variable.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {parseCSSTime} from "../../utils/css.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Tooltip Context
 * -----------------------------------------------------------------------------------------------*/
type TooltipContext = {
  slots?: ReturnType<typeof tooltipVariants>;
};

const TooltipContext = createContext<TooltipContext>({});

/* -------------------------------------------------------------------------------------------------
 * Tooltip Animation Scope
 * -----------------------------------------------------------------------------------------------*/
type TooltipAnimationScopeProps = {
  children: ReactNode;
  shouldSkipAnimation?: boolean;
};

/*
 * RAC sets shouldSkipAnimation while its global warmup timer is active, and because of it
 * Tooltip loses data-entering / data-exiting when one tooltip replaces another. Both phases
 * drive the CSS keyframes here, so the flag is reset for descendants — the fade on switch is
 * preserved.
 */
const TooltipAnimationScope = ({children, shouldSkipAnimation}: TooltipAnimationScopeProps) => {
  const state = use(TooltipTriggerStateContext);

  if (!state || shouldSkipAnimation) return children;

  return (
    <TooltipTriggerStateContext value={{...state, shouldSkipAnimation: false}}>
      {children}
    </TooltipTriggerStateContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Root
 * -----------------------------------------------------------------------------------------------*/
type TooltipRootProps = ComponentPropsWithRef<typeof TooltipTriggerPrimitive> & {
  /**
   * Let React Aria skip the enter and exit animations when moving quickly from
   * one tooltip to another.
   *
   * @default false
   */
  shouldSkipAnimation?: boolean;
};

const TooltipRoot = ({
  children,
  closeDelay,
  delay,
  shouldSkipAnimation = false,
  ...props
}: TooltipRootProps) => {
  const slots = React.useMemo(() => tooltipVariants(), []);

  const cssDelay = useCSSVariable("--tooltip-delay");
  const cssCloseDelay = useCSSVariable("--tooltip-close-delay");

  const resolvedDelay = delay ?? parseCSSTime(cssDelay);
  const resolvedCloseDelay = closeDelay ?? parseCSSTime(cssCloseDelay);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <TooltipContext value={contextValue}>
      <TooltipTriggerPrimitive
        closeDelay={resolvedCloseDelay}
        delay={resolvedDelay}
        {...props}
        data-slot="tooltip-root"
      >
        <TooltipAnimationScope shouldSkipAnimation={shouldSkipAnimation}>
          {children}
        </TooltipAnimationScope>
      </TooltipTriggerPrimitive>
    </TooltipContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Content
 * -----------------------------------------------------------------------------------------------*/
interface TooltipContentProps
  extends Omit<ComponentPropsWithRef<typeof TooltipPrimitive>, "children">, TooltipVariants {
  showArrow?: boolean;
  children: React.ReactNode;
}

const TooltipContent = ({
  children,
  className,
  offset: offsetProp,
  showArrow = false,
  ...props
}: TooltipContentProps) => {
  const {slots} = use(TooltipContext);
  const offset = offsetProp ? offsetProp : showArrow ? 7 : 3;

  return (
    <TooltipPrimitive
      className={composeTwRenderProps(className, slots?.base())}
      offset={offset}
      {...props}
      data-slot="tooltip"
    >
      {children}
    </TooltipPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Arrow
 * -----------------------------------------------------------------------------------------------*/
type TooltipArrowProps = Omit<ComponentPropsWithRef<typeof OverlayArrow>, "children"> & {
  children?: React.ReactNode;
};

const TooltipArrow = ({children, className, ...props}: TooltipArrowProps) => {
  const defaultArrow = (
    <svg
      data-slot="overlay-arrow"
      fill="none"
      height="12"
      viewBox="0 0 12 12"
      width="12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 0C5.48483 8 6.5 8 12 0Z" />
    </svg>
  );

  const arrow = React.isValidElement(children)
    ? React.cloneElement(
        children as React.ReactElement<{
          className?: string;
          "data-slot"?: "overlay-arrow";
        }>,
        {
          "data-slot": "overlay-arrow",
        },
      )
    : defaultArrow;

  return (
    <OverlayArrow {...props} className={className} data-slot="tooltip-arrow">
      {arrow}
    </OverlayArrow>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Tooltip Trigger
 * -----------------------------------------------------------------------------------------------*/
interface TooltipTriggerProps<
  E extends keyof React.JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const TooltipTrigger = <E extends keyof React.JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: TooltipTriggerProps<E> & Omit<React.JSX.IntrinsicElements[E], keyof TooltipTriggerProps<E>>) => {
  const {slots} = use(TooltipContext);
  const triggerRef = useRef<HTMLElement | null>(null);
  /*
   * The useFocusable hook directly, not the <Focusable> wrapper. Both read FocusableContext,
   * which TooltipTriggerPrimitive provides through its <FocusableProvider> (the trigger's props
   * and triggerRef live there), and both yield the same focusableProps (tabIndex, focus,
   * keyboard handlers). But the wrapper runs a dev-only isFocusable(el) check in useEffect —
   * it walks the ancestors looking for inert, and when the Tooltip is mounted in an inert
   * subtree (behind an open Drawer/Modal, say), the check fires spuriously:
   * "<Focusable> child must be focusable…".
   */
  const {focusableProps} = useFocusable({}, triggerRef);

  return (
    <dom.div
      ref={triggerRef}
      className={composeSlotClassName(slots?.trigger, className)}
      role="button"
      /*
       * The permitted `any`: the element type is a parameter the spread has already erased, and
       * no expressible annotation exists for it. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...mergeProps(focusableProps, props as any)}
      data-slot="tooltip-trigger"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TooltipRoot, TooltipTrigger, TooltipContent, TooltipArrow};

export type {TooltipRootProps, TooltipArrowProps, TooltipContentProps, TooltipTriggerProps};

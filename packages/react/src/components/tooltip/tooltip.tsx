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
 * RAC выставляет shouldSkipAnimation, пока активен её глобальный warmup-таймер, и из-за этого
 * Tooltip теряет data-entering / data-exiting, когда одна подсказка сменяет другую. Обе фазы
 * здесь ведут CSS-кейфреймы, поэтому флаг сбрасывается для потомков — фейд при смене сохраняется.
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
   * Разрешить React Aria пропускать анимации входа и выхода, пока активен её глобальный
   * warmup-таймер — то есть при быстром переходе от одной подсказки к другой.
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
        data-slot="tooltip-root"
        delay={resolvedDelay}
        {...props}
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
      {...props}
      className={composeTwRenderProps(className, slots?.base())}
      offset={offset}
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
    <OverlayArrow data-slot="tooltip-arrow" {...props} className={className}>
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
   * Хук useFocusable напрямую, а не обёртка <Focusable>. Оба читают FocusableContext, который
   * разворачивает TooltipTriggerPrimitive через свой <FocusableProvider> (там лежат пропы
   * триггера и triggerRef), и дают одинаковые focusableProps (tabIndex, focus, обработчики
   * клавиатуры). Но обёртка гоняет dev-only проверку isFocusable(el) в useEffect — она поднимается
   * по предкам в поисках inert, и когда Tooltip монтирован в inert-поддереве (например, за открытым
   * Drawer/Modal), проверка даёт ложное срабатывание: "<Focusable> child must be focusable…".
   */
  const {focusableProps} = useFocusable({}, triggerRef);

  return (
    <dom.div
      ref={triggerRef}
      className={composeSlotClassName(slots?.trigger, className)}
      data-slot="tooltip-trigger"
      role="button"
      /*
       * Разрешённое место для any: тип элемента здесь параметр, который spread уже стёр, и
       * выразимой аннотации для него не существует. references/typescript.md.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...mergeProps(focusableProps, props as any)}
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

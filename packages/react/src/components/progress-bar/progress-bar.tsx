"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ProgressBarVariants} from "@peakui/styles";
import type {CSSProperties, ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {ProgressBarRenderProps} from "react-aria-components/ProgressBar";

import {progressBarVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {ProgressBar as ProgressBarPrimitive} from "react-aria-components/ProgressBar";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Context
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarContext {
  slots?: ReturnType<typeof progressBarVariants>;
  state?: ProgressBarRenderProps;
}

const ProgressBarContext = createContext<ProgressBarContext>({});

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Root
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarRootProps
  extends ComponentPropsWithRef<typeof ProgressBarPrimitive>, ProgressBarVariants {}

const ProgressBarRoot = ({children, className, color, size, ...props}: ProgressBarRootProps) => {
  const slots = React.useMemo(() => progressBarVariants({color, size}), [color, size]);

  return (
    <ProgressBarPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="progress-bar"
    >
      {(values) => (
        <ProgressBarContext value={{slots, state: values}}>
          {typeof children === "function" ? children(values) : children}
        </ProgressBarContext>
      )}
    </ProgressBarPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Output
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarOutputProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ProgressBarOutput = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: ProgressBarOutputProps<E> & Omit<JSX.IntrinsicElements[E], keyof ProgressBarOutputProps<E>>) => {
  const {slots, state} = use(ProgressBarContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.output, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-bar-output"
    >
      {children ?? state?.valueText}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Track
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarTrackProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ProgressBarTrack = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ProgressBarTrackProps<E> & Omit<JSX.IntrinsicElements[E], keyof ProgressBarTrackProps<E>>) => {
  const {slots} = use(ProgressBarContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.track, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-bar-track"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressBar Fill
 * -----------------------------------------------------------------------------------------------*/
interface ProgressBarFillProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const ProgressBarFill = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  style,
  ...props
}: ProgressBarFillProps<E> & Omit<JSX.IntrinsicElements[E], keyof ProgressBarFillProps<E>>) => {
  const {slots, state} = use(ProgressBarContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.fill, className)}
      style={{
        ...style,
        width: state?.isIndeterminate ? undefined : `${state?.percentage ?? 0}%`,
      }}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-bar-fill"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ProgressBarRoot, ProgressBarOutput, ProgressBarTrack, ProgressBarFill};

export type {
  ProgressBarRootProps,
  ProgressBarOutputProps,
  ProgressBarTrackProps,
  ProgressBarFillProps,
};

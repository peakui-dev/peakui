"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {MeterVariants} from "@peakui/styles";
import type {CSSProperties, ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {MeterRenderProps} from "react-aria-components/Meter";

import {meterVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Meter as MeterPrimitive} from "react-aria-components/Meter";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * Meter Context
 * -----------------------------------------------------------------------------------------------*/
interface MeterContext {
  slots?: ReturnType<typeof meterVariants>;
  state?: MeterRenderProps;
}

const MeterContext = createContext<MeterContext>({});

/* -------------------------------------------------------------------------------------------------
 * Meter Root
 * -----------------------------------------------------------------------------------------------*/
interface MeterRootProps extends ComponentPropsWithRef<typeof MeterPrimitive>, MeterVariants {}

const MeterRoot = ({children, className, color, size, ...props}: MeterRootProps) => {
  const slots = React.useMemo(() => meterVariants({color, size}), [color, size]);

  return (
    <MeterPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="meter"
    >
      {(values) => (
        <MeterContext value={{slots, state: values}}>
          {typeof children === "function" ? children(values) : children}
        </MeterContext>
      )}
    </MeterPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Meter Output
 * -----------------------------------------------------------------------------------------------*/
interface MeterOutputProps<E extends keyof JSX.IntrinsicElements = "span"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const MeterOutput = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: MeterOutputProps<E> & Omit<JSX.IntrinsicElements[E], keyof MeterOutputProps<E>>) => {
  const {slots, state} = use(MeterContext);

  return (
    <dom.span
      className={composeSlotClassName(slots?.output, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="meter-output"
    >
      {children ?? state?.valueText}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Meter Track
 * -----------------------------------------------------------------------------------------------*/
interface MeterTrackProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
}

const MeterTrack = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: MeterTrackProps<E> & Omit<JSX.IntrinsicElements[E], keyof MeterTrackProps<E>>) => {
  const {slots} = use(MeterContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.track, className)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="meter-track"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Meter Fill
 * -----------------------------------------------------------------------------------------------*/
interface MeterFillProps<E extends keyof JSX.IntrinsicElements = "div"> extends DOMRenderProps<
  E,
  undefined
> {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const MeterFill = <E extends keyof JSX.IntrinsicElements = "div">({
  className,
  style,
  ...props
}: MeterFillProps<E> & Omit<JSX.IntrinsicElements[E], keyof MeterFillProps<E>>) => {
  const {slots, state} = use(MeterContext);

  return (
    <dom.div
      className={composeSlotClassName(slots?.fill, className)}
      style={{
        ...style,
        width: `${state?.percentage ?? 0}%`,
      }}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="meter-fill"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {MeterRoot, MeterOutput, MeterTrack, MeterFill};

export type {MeterRootProps, MeterOutputProps, MeterTrackProps, MeterFillProps};

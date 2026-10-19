"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ProgressCircleVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {ProgressBarRenderProps} from "react-aria-components/ProgressBar";

import {progressCircleVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {ProgressBar as ProgressBarPrimitive} from "react-aria-components/ProgressBar";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle Constants
 * -----------------------------------------------------------------------------------------------*/
const STROKE_WIDTH = 4;
const CENTER = 18;
const RADIUS = CENTER - STROKE_WIDTH / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle Context
 * -----------------------------------------------------------------------------------------------*/
interface ProgressCircleContext {
  slots?: ReturnType<typeof progressCircleVariants>;
  state?: ProgressBarRenderProps;
}

const ProgressCircleContext = createContext<ProgressCircleContext>({});

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle Root
 * -----------------------------------------------------------------------------------------------*/
interface ProgressCircleRootProps
  extends ComponentPropsWithRef<typeof ProgressBarPrimitive>, ProgressCircleVariants {}

const ProgressCircleRoot = ({
  children,
  className,
  color,
  size,
  ...props
}: ProgressCircleRootProps) => {
  const slots = React.useMemo(() => progressCircleVariants({color, size}), [color, size]);

  return (
    <ProgressBarPrimitive
      className={composeTwRenderProps(className, slots.base())}
      {...props}
      data-slot="progress-circle"
    >
      {(values) => (
        <ProgressCircleContext value={{slots, state: values}}>
          {typeof children === "function" ? children(values) : children}
        </ProgressCircleContext>
      )}
    </ProgressBarPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle Track
 * -----------------------------------------------------------------------------------------------*/
interface ProgressCircleTrackProps<
  E extends keyof JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ProgressCircleTrack = <E extends keyof JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: ProgressCircleTrackProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ProgressCircleTrackProps<E>>) => {
  const {slots} = use(ProgressCircleContext);

  return (
    <dom.svg
      className={composeSlotClassName(slots?.track, className)}
      fill="none"
      viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-circle-track"
    >
      {children}
    </dom.svg>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle TrackCircle
 * -----------------------------------------------------------------------------------------------*/
interface ProgressCircleTrackCircleProps<
  E extends keyof JSX.IntrinsicElements = "circle",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ProgressCircleTrackCircle = <E extends keyof JSX.IntrinsicElements = "circle">({
  className,
  ...props
}: ProgressCircleTrackCircleProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ProgressCircleTrackCircleProps<E>>) => {
  const {slots} = use(ProgressCircleContext);

  return (
    <dom.circle
      className={composeSlotClassName(slots?.trackCircle, className)}
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      strokeWidth={STROKE_WIDTH}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-circle-track-circle"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * ProgressCircle FillCircle
 * -----------------------------------------------------------------------------------------------*/
interface ProgressCircleFillCircleProps<
  E extends keyof JSX.IntrinsicElements = "circle",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ProgressCircleFillCircle = <E extends keyof JSX.IntrinsicElements = "circle">({
  className,
  ...props
}: ProgressCircleFillCircleProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ProgressCircleFillCircleProps<E>>) => {
  const {slots, state} = use(ProgressCircleContext);
  const percentage = state?.percentage ?? 0;
  const isIndeterminate = state?.isIndeterminate ?? false;
  const strokeDashoffset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

  return (
    <dom.circle
      className={composeSlotClassName(slots?.fillCircle, className)}
      cx={CENTER}
      cy={CENTER}
      r={RADIUS}
      strokeDasharray={CIRCUMFERENCE}
      strokeDashoffset={isIndeterminate ? CIRCUMFERENCE * 0.75 : strokeDashoffset}
      strokeLinecap="round"
      strokeWidth={STROKE_WIDTH}
      transform={`rotate(-90 ${CENTER} ${CENTER})`}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="progress-circle-fill-circle"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ProgressCircleRoot,
  ProgressCircleTrack,
  ProgressCircleTrackCircle,
  ProgressCircleFillCircle,
};

export type {
  ProgressCircleRootProps,
  ProgressCircleTrackProps,
  ProgressCircleTrackCircleProps,
  ProgressCircleFillCircleProps,
};

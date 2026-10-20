"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {DateInputGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {
  DateInputProps as DateInputPrimitiveProps,
  DateSegmentProps as DateSegmentPrimitiveProps,
} from "react-aria-components/DateField";

import {dateInputGroupVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {
  DateInput as DateInputPrimitive,
  DateSegment as DateSegmentPrimitive,
} from "react-aria-components/DateField";
import {Group as GroupPrimitive} from "react-aria-components/Group";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Context
 * -----------------------------------------------------------------------------------------------*/
type DateInputGroupContext = {
  slots?: ReturnType<typeof dateInputGroupVariants>;
};

const DateInputGroupContext = createContext<DateInputGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface DateInputGroupRootProps
  extends ComponentPropsWithRef<typeof GroupPrimitive>, DateInputGroupVariants {}

const DateInputGroupRoot = ({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: DateInputGroupRootProps) => {
  const slots = useMemo(() => dateInputGroupVariants({fullWidth, variant}), [fullWidth, variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <DateInputGroupContext value={contextValue}>
      <GroupPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="date-input-group"
      >
        {children}
      </GroupPrimitive>
    </DateInputGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Prefix
 * -----------------------------------------------------------------------------------------------*/
interface DateInputGroupPrefixProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DateInputGroupPrefix = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DateInputGroupPrefixProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DateInputGroupPrefixProps<E>>) => {
  const {slots} = use(DateInputGroupContext);

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.prefix, className)}
      data-slot="date-input-group-prefix"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Input
 * -----------------------------------------------------------------------------------------------*/
/*
 * The RAC DateInput reads whichever field provides the state, so this one part serves a DateField,
 * a TimeField and the pickers.
 */
interface DateInputGroupInputProps extends DateInputPrimitiveProps {}

const DateInputGroupInput = ({className, ...props}: DateInputGroupInputProps) => {
  const {slots} = use(DateInputGroupContext);

  return (
    <DateInputPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.input())}
      data-slot="date-input-group-input"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup InputContainer
 * -----------------------------------------------------------------------------------------------*/
interface DateInputGroupInputContainerProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DateInputGroupInputContainer = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DateInputGroupInputContainerProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DateInputGroupInputContainerProps<E>>) => {
  const {slots} = use(DateInputGroupContext);

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.inputContainer, className)}
      data-slot="date-input-group-input-container"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Segment
 * -----------------------------------------------------------------------------------------------*/
interface DateInputGroupSegmentProps extends Omit<DateSegmentPrimitiveProps, "className"> {
  className?: string;
}

const DateInputGroupSegment = ({className, ...props}: DateInputGroupSegmentProps) => {
  const {slots} = use(DateInputGroupContext);

  return (
    <DateSegmentPrimitive
      {...props}
      className={composeSlotClassName(slots?.segment, className)}
      data-slot="date-input-group-segment"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateInputGroup Suffix
 * -----------------------------------------------------------------------------------------------*/
interface DateInputGroupSuffixProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DateInputGroupSuffix = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: DateInputGroupSuffixProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DateInputGroupSuffixProps<E>>) => {
  const {slots} = use(DateInputGroupContext);

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.suffix, className)}
      data-slot="date-input-group-suffix"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DateInputGroupRoot,
  DateInputGroupInput,
  DateInputGroupInputContainer,
  DateInputGroupPrefix,
  DateInputGroupSegment,
  DateInputGroupSuffix,
};

export type {
  DateInputGroupRootProps,
  DateInputGroupInputProps,
  DateInputGroupInputContainerProps,
  DateInputGroupPrefixProps,
  DateInputGroupSegmentProps,
  DateInputGroupSuffixProps,
};

"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SurfaceVariants} from "../surface/index.ts";
import type {DateRangePickerVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode, RefObject} from "react";
import type {DateValue} from "react-aria-components/Calendar";

import {dateRangePickerVariants} from "@peakui/styles";
import {mergeRefs} from "@react-aria/utils";
import {createContext, use, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {DateRangePicker as DateRangePickerPrimitive} from "react-aria-components/DateRangePicker";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconCalendar} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Context
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerContext {
  slots?: ReturnType<typeof dateRangePickerVariants>;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const DateRangePickerContext = createContext<DateRangePickerContext>({
  triggerRef: {current: null},
});

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Root
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerRootProps<T extends DateValue = DateValue>
  extends ComponentPropsWithRef<typeof DateRangePickerPrimitive<T>>, DateRangePickerVariants {}

const DateRangePickerRoot = <T extends DateValue = DateValue>({
  children,
  className,
  onOpenChange,
  ...props
}: DateRangePickerRootProps<T>) => {
  const slots = useMemo(() => dateRangePickerVariants(), []);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const shouldRestoreFocusToTriggerRef = useRef(false);

  /*
   * The popover is anchored to the field, and React Aria returns focus to the field's last
   * focused segment when it closes. A keyboard user opened it from the trigger, so focus goes
   * back there; a pointer dismissal is left to React Aria.
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        shouldRestoreFocusToTriggerRef.current = true;
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
    };
  }, [isOpen]);

  const handleOpenChange = (nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen);

    if (!nextIsOpen && shouldRestoreFocusToTriggerRef.current) {
      window.requestAnimationFrame(() => {
        triggerRef.current?.focus();
      });
    }

    shouldRestoreFocusToTriggerRef.current = false;
    onOpenChange?.(nextIsOpen);
  };

  const contextValue = useMemo(() => ({slots, triggerRef}), [slots]);

  return (
    <DateRangePickerContext value={contextValue}>
      <DateRangePickerPrimitive
        data-required={dataAttr(props.isRequired)}
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="date-range-picker"
        onOpenChange={handleOpenChange}
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </DateRangePickerPrimitive>
    </DateRangePickerContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Trigger
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DateRangePickerTrigger = ({
  children,
  className,
  ref,
  ...props
}: DateRangePickerTriggerProps) => {
  const {slots, triggerRef} = use(DateRangePickerContext);
  const contextRef = useCallback(
    (node: HTMLButtonElement | null) => {
      triggerRef.current = node;
    },
    [triggerRef],
  );
  const mergedRef = useMemo(() => mergeRefs(contextRef, ref), [contextRef, ref]);

  return (
    <ButtonPrimitive
      ref={mergedRef}
      {...props}
      className={composeTwRenderProps(className, slots?.trigger())}
      data-slot="date-range-picker-trigger"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Trigger Indicator
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerTriggerIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DateRangePickerTriggerIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: DateRangePickerTriggerIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DateRangePickerTriggerIndicatorProps<E>>) => {
  const {slots} = use(DateRangePickerContext);

  return (
    <dom.span
      aria-hidden="true"
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.triggerIndicator, className)}
      data-slot="date-range-picker-trigger-indicator"
    >
      {children ?? <IconCalendar />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Range Separator
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerRangeSeparatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DateRangePickerRangeSeparator = <E extends keyof JSX.IntrinsicElements = "span">({
  children = "–",
  className,
  ...props
}: DateRangePickerRangeSeparatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DateRangePickerRangeSeparatorProps<E>>) => {
  const {slots} = use(DateRangePickerContext);

  return (
    <dom.span
      aria-hidden="true"
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.rangeSeparator, className)}
      data-slot="date-range-picker-range-separator"
    >
      {children}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DateRangePicker Popover
 * -----------------------------------------------------------------------------------------------*/
interface DateRangePickerPopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children"
> {
  children: ReactNode;
}

const DateRangePickerPopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: DateRangePickerPopoverProps) => {
  const {slots} = use(DateRangePickerContext);
  const surface = useMemo(() => ({variant: "default" as SurfaceVariants["variant"]}), []);

  return (
    <SurfaceContext value={surface}>
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="date-range-picker-popover"
        placement={placement}
      >
        {children}
      </PopoverPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  DateRangePickerRoot,
  DateRangePickerTrigger,
  DateRangePickerTriggerIndicator,
  DateRangePickerRangeSeparator,
  DateRangePickerPopover,
};

export type {
  DateRangePickerRootProps,
  DateRangePickerTriggerProps,
  DateRangePickerTriggerIndicatorProps,
  DateRangePickerRangeSeparatorProps,
  DateRangePickerPopoverProps,
};

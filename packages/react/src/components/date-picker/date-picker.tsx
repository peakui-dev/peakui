"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SurfaceVariants} from "../surface/index.ts";
import type {DatePickerVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode, RefObject} from "react";
import type {DateValue} from "react-aria-components/Calendar";

import {datePickerVariants} from "@peakui/styles";
import {mergeRefs} from "@react-aria/utils";
import {createContext, use, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {DatePicker as DatePickerPrimitive} from "react-aria-components/DatePicker";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {IconCalendar} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * DatePicker Context
 * -----------------------------------------------------------------------------------------------*/
interface DatePickerContext {
  slots?: ReturnType<typeof datePickerVariants>;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const DatePickerContext = createContext<DatePickerContext>({
  triggerRef: {current: null},
});

/* -------------------------------------------------------------------------------------------------
 * DatePicker Root
 * -----------------------------------------------------------------------------------------------*/
interface DatePickerRootProps<T extends DateValue = DateValue>
  extends ComponentPropsWithRef<typeof DatePickerPrimitive<T>>, DatePickerVariants {}

const DatePickerRoot = <T extends DateValue = DateValue>({
  children,
  className,
  onOpenChange,
  ...props
}: DatePickerRootProps<T>) => {
  const slots = useMemo(() => datePickerVariants(), []);
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
    <DatePickerContext value={contextValue}>
      <DatePickerPrimitive
        data-required={dataAttr(props.isRequired)}
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="date-picker"
        onOpenChange={handleOpenChange}
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </DatePickerPrimitive>
    </DatePickerContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DatePicker Trigger
 * -----------------------------------------------------------------------------------------------*/
interface DatePickerTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const DatePickerTrigger = ({children, className, ref, ...props}: DatePickerTriggerProps) => {
  const {slots, triggerRef} = use(DatePickerContext);
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
      data-slot="date-picker-trigger"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DatePicker Trigger Indicator
 * -----------------------------------------------------------------------------------------------*/
interface DatePickerTriggerIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const DatePickerTriggerIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: DatePickerTriggerIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof DatePickerTriggerIndicatorProps<E>>) => {
  const {slots} = use(DatePickerContext);

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
      data-slot="date-picker-trigger-indicator"
    >
      {children ?? <IconCalendar />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * DatePicker Popover
 * -----------------------------------------------------------------------------------------------*/
interface DatePickerPopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children"
> {
  children: ReactNode;
}

const DatePickerPopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: DatePickerPopoverProps) => {
  const {slots} = use(DatePickerContext);
  const surface = useMemo(() => ({variant: "default" as SurfaceVariants["variant"]}), []);

  return (
    <SurfaceContext value={surface}>
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="date-picker-popover"
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
export {DatePickerRoot, DatePickerTrigger, DatePickerTriggerIndicator, DatePickerPopover};

export type {
  DatePickerRootProps,
  DatePickerTriggerProps,
  DatePickerTriggerIndicatorProps,
  DatePickerPopoverProps,
};

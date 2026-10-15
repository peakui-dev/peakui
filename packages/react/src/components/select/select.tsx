"use client";

import type {Booleanish} from "../../utils/assertion.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SurfaceVariants} from "../surface/index.ts";
import type {SelectVariants} from "@peakui/styles";
import type {KeyboardEvent as AriaKeyboardEvent} from "@react-types/shared";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {selectVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";
import {
  Select as SelectPrimitive,
  SelectStateContext,
  SelectValue as SelectValuePrimitive,
} from "react-aria-components/Select";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";
import {FieldSlotsGate} from "../../utils/field-slots-gate.tsx";
import {CloseIcon, IconChevronDown} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * Select Context
 * -----------------------------------------------------------------------------------------------*/
type SelectState = React.ContextType<typeof SelectStateContext>;

type SelectContext = {
  slots?: ReturnType<typeof selectVariants>;
  onClear?: () => void;
  isDisabled?: boolean;
  /**
   * Whether a `Select.ClearButton` is mounted, which enables the trigger's clear
   * shortcut. Read at event time so registration never triggers a re-render.
   */
  hasClearButton?: () => boolean;
  /** Called by `Select.ClearButton` on mount. Returns its own cleanup. */
  registerClearButton?: () => () => void;
};

const SelectContext = createContext<SelectContext>({});

/**
 * Exposes the trigger's resolved disabled state, which accounts for both the root's
 * `isDisabled` and a `Select.Trigger`-level override.
 */
const SelectTriggerContext = createContext<{isDisabled?: boolean}>({});

const isSelectionEmpty = (state: SelectState) =>
  (state?.selectionManager.selectedKeys.size ?? 0) === 0;

const clearSelection = (state: SelectState, onClear?: () => void) => {
  state?.selectionManager.setSelectedKeys(new Set());
  onClear?.();
};

/* -------------------------------------------------------------------------------------------------
 * Select Root
 * -----------------------------------------------------------------------------------------------*/
interface SelectRootProps<T extends object, M extends "single" | "multiple" = "single">
  extends ComponentPropsWithRef<typeof SelectPrimitive<T, M>>, SelectVariants {
  items?: Iterable<T, M>;
  /** Handler that is called when the selection is cleared. */
  onClear?: () => void;
}

const SelectRoot = <T extends object = object, M extends "single" | "multiple" = "single">({
  children,
  className,
  fullWidth,
  isDisabled,
  onClear,
  variant,
  ...props
}: SelectRootProps<T, M>) => {
  const slots = React.useMemo(() => selectVariants({fullWidth, variant}), [fullWidth, variant]);
  const clearButtonCount = React.useRef(0);

  // Counted rather than a boolean so unmounting one clear button cannot switch the
  // shortcut off while another is still mounted.
  const registerClearButton = React.useCallback(() => {
    clearButtonCount.current += 1;

    return () => {
      clearButtonCount.current -= 1;
    };
  }, []);

  const hasClearButton = React.useCallback(() => clearButtonCount.current > 0, []);

  const context = React.useMemo<SelectContext>(
    () => ({hasClearButton, isDisabled, onClear, registerClearButton, slots}),
    [hasClearButton, isDisabled, onClear, registerClearButton, slots],
  );

  return (
    <FieldSlotsGate>
      <SelectContext value={context}>
        <SelectPrimitive
          {...props}
          className={composeTwRenderProps(className, slots?.base())}
          data-slot="select"
          isDisabled={isDisabled}
        >
          {(values) => <>{typeof children === "function" ? children(values) : children}</>}
        </SelectPrimitive>
      </SelectContext>
    </FieldSlotsGate>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Select Trigger
 * -----------------------------------------------------------------------------------------------*/
interface SelectTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const SelectTrigger = ({children, className, onKeyDown, ...props}: SelectTriggerProps) => {
  const {hasClearButton, onClear, slots} = use(SelectContext);
  const state = use(SelectStateContext);

  // ARIA treats the children of a button as presentational, so Select.ClearButton can
  // never take focus. This shortcut is the only pointer-free way to clear, and it is
  // gated on a clear button being composed so a plain Select stays non-clearable.
  const handleKeyDown = (e: AriaKeyboardEvent) => {
    onKeyDown?.(e);

    const isClearKey = e.key === "Backspace" || e.key === "Delete";
    const canClear = Boolean(hasClearButton?.()) && !isSelectionEmpty(state);

    if (!isClearKey || !canClear || state?.isOpen) {
      // react-aria's useKeyboard swallows propagation unless a handler opts back in,
      // and the trigger had no keydown handler at all before this shortcut existed.
      e.continuePropagation();

      return;
    }

    e.preventDefault();
    clearSelection(state, onClear);
  };

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.trigger())}
      {...props}
      data-slot="select-trigger"
      onKeyDown={handleKeyDown}
    >
      {(values) => (
        <SelectTriggerContext value={{isDisabled: values.isDisabled}}>
          {typeof children === "function" ? children(values) : children}
        </SelectTriggerContext>
      )}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Select Value
 * -----------------------------------------------------------------------------------------------*/
interface SelectValueProps extends ComponentPropsWithRef<typeof SelectValuePrimitive> {}

const SelectValue = ({children, className, ...props}: SelectValueProps) => {
  const {slots} = use(SelectContext);

  return (
    <SelectValuePrimitive
      className={composeTwRenderProps(className, slots?.value())}
      {...props}
      data-slot="select-value"
    >
      {children}
    </SelectValuePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Select Indicator
 * -----------------------------------------------------------------------------------------------*/
interface SelectIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: React.ReactNode;
  className?: string;
}

const SelectIndicator = <E extends keyof React.JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: SelectIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof SelectIndicatorProps<E>>) => {
  const {slots} = use(SelectContext);
  const state = use(SelectStateContext);

  if (children && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        className?: string;
        "data-slot"?: "select-indicator";
        "data-open"?: Booleanish;
      }>,
      {
        /*
         * The permitted `any`: the element type is a parameter, and the spread has erased it.
         * references/typescript.md, the polymorphic spread boundary.
         */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(props as any),
        className: composeSlotClassName(slots?.indicator, className),
        "data-slot": "select-indicator",
        "data-open": dataAttr(state?.isOpen),
      },
    );
  }

  return (
    <IconChevronDown
      className={composeSlotClassName(slots?.indicator, className)}
      data-open={dataAttr(state?.isOpen)}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="select-default-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Select Clear Button
 * -----------------------------------------------------------------------------------------------*/
interface SelectClearButtonProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const SelectClearButton = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  onClick,
  onPointerDown,
  ...props
}: SelectClearButtonProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof SelectClearButtonProps<E>>) => {
  const {isDisabled: rootDisabled, onClear, registerClearButton, slots} = use(SelectContext);
  const {isDisabled: triggerDisabled} = use(SelectTriggerContext);
  const state = use(SelectStateContext);

  const isDisabled = triggerDisabled ?? rootDisabled ?? false;
  const isEmpty = isSelectionEmpty(state);

  // Opts the trigger into the Backspace/Delete shortcut, which is how keyboard and
  // screen reader users clear. See SelectTrigger.
  React.useEffect(() => registerClearButton?.(), [registerClearButton]);

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    // Select.Trigger is a <button>, and nesting a <button> in one is invalid HTML, so
    // this control is a span. Keep the press off the trigger so the menu stays closed.
    // The default is left intact so focus still lands on the trigger, which is where
    // the clear shortcut lives.
    e.stopPropagation();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPointerDown?.(e as any);
  };

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Clearing happens here rather than on pointer down so that only a primary-button
    // click clears; `pointerdown` also fires for secondary and middle buttons.
    if (!isDisabled && !isEmpty) {
      clearSelection(state, onClear);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick?.(e as any);
  };

  return (
    <dom.span
      aria-hidden
      className={slots?.clearButton({className})}
      data-empty={dataAttr(isEmpty)}
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="select-clear-button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      {children ?? <CloseIcon data-slot="select-clear-button-icon" />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Select Popover
 * -----------------------------------------------------------------------------------------------*/
interface SelectPopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children"
> {
  children: React.ReactNode;
}

const SelectPopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: SelectPopoverProps) => {
  const {slots} = use(SelectContext);

  return (
    <SurfaceContext
      value={{
        variant: "default" as SurfaceVariants["variant"],
      }}
    >
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="select-popover"
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
export {SelectRoot, SelectTrigger, SelectValue, SelectIndicator, SelectClearButton, SelectPopover};

export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectValueProps,
  SelectIndicatorProps,
  SelectClearButtonProps,
  SelectPopoverProps,
};

"use client";

import type {Booleanish} from "../../utils/assertion.ts";
import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {SurfaceVariants} from "../surface/index.ts";
import type {AutocompleteVariants} from "@peakui/styles";
import type {KeyboardEvent as AriaKeyboardEvent} from "@react-types/shared";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {autocompleteVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Autocomplete as AutocompletePrimitive, useFilter} from "react-aria-components/Autocomplete";
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
 * Autocomplete Context
 * -----------------------------------------------------------------------------------------------*/
type SelectState = React.ContextType<typeof SelectStateContext>;

type AutocompleteContext = {
  slots?: ReturnType<typeof autocompleteVariants>;
  onClear?: () => void;
  isDisabled?: boolean;
  /**
   * Whether a `Autocomplete.ClearButton` is mounted, which enables the trigger's clear
   * shortcut. Read at event time so registration never triggers a re-render.
   */
  hasClearButton?: () => boolean;
  /** Called by `Autocomplete.ClearButton` on mount. Returns its own cleanup. */
  registerClearButton?: () => () => void;
};

const AutocompleteContext = createContext<AutocompleteContext>({});

/**
 * Exposes the trigger's resolved disabled state, which accounts for both the root's
 * `isDisabled` and a `Autocomplete.Trigger`-level override.
 */
const AutocompleteTriggerContext = createContext<{isDisabled?: boolean}>({});

const isSelectionEmpty = (state: SelectState) =>
  (state?.selectionManager.selectedKeys.size ?? 0) === 0;

const clearSelection = (state: SelectState, onClear?: () => void) => {
  state?.selectionManager.setSelectedKeys(new Set());
  onClear?.();
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Root
 * -----------------------------------------------------------------------------------------------*/
interface AutocompleteRootProps<T extends object, M extends "single" | "multiple" = "single">
  extends ComponentPropsWithRef<typeof SelectPrimitive<T, M>>, AutocompleteVariants {
  items?: Iterable<T, M>;
  /** Handler that is called when the selection is cleared. */
  onClear?: () => void;
}

const AutocompleteRoot = <T extends object = object, M extends "single" | "multiple" = "single">({
  children,
  className,
  fullWidth,
  isDisabled,
  onClear,
  variant,
  ...props
}: AutocompleteRootProps<T, M>) => {
  const slots = React.useMemo(
    () => autocompleteVariants({fullWidth, variant}),
    [fullWidth, variant],
  );
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

  const context = React.useMemo<AutocompleteContext>(
    () => ({hasClearButton, isDisabled, onClear, registerClearButton, slots}),
    [hasClearButton, isDisabled, onClear, registerClearButton, slots],
  );

  return (
    <FieldSlotsGate>
      <AutocompleteContext value={context}>
        <SelectPrimitive
          {...props}
          className={composeTwRenderProps(className, slots?.base())}
          data-slot="autocomplete"
          isDisabled={isDisabled}
        >
          {(values) => <>{typeof children === "function" ? children(values) : children}</>}
        </SelectPrimitive>
      </AutocompleteContext>
    </FieldSlotsGate>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Trigger
 * -----------------------------------------------------------------------------------------------*/
interface AutocompleteTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const AutocompleteTrigger = ({
  children,
  className,
  onKeyDown,
  ...props
}: AutocompleteTriggerProps) => {
  const {hasClearButton, onClear, slots} = use(AutocompleteContext);
  const state = use(SelectStateContext);

  // ARIA treats the children of a button as presentational, so Autocomplete.ClearButton can
  // never take focus. This shortcut is the only pointer-free way to clear, and it is
  // gated on a clear button being composed so a plain Autocomplete stays non-clearable.
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
      data-slot="autocomplete-trigger"
      onKeyDown={handleKeyDown}
    >
      {(values) => (
        <AutocompleteTriggerContext value={{isDisabled: values.isDisabled}}>
          {typeof children === "function" ? children(values) : children}
        </AutocompleteTriggerContext>
      )}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Value
 * -----------------------------------------------------------------------------------------------*/
interface AutocompleteValueProps extends ComponentPropsWithRef<typeof SelectValuePrimitive> {}

const AutocompleteValue = ({children, className, ...props}: AutocompleteValueProps) => {
  const {slots} = use(AutocompleteContext);

  return (
    <SelectValuePrimitive
      className={composeTwRenderProps(className, slots?.value())}
      {...props}
      data-slot="autocomplete-value"
    >
      {children}
    </SelectValuePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Indicator
 * -----------------------------------------------------------------------------------------------*/
interface AutocompleteIndicatorProps<
  E extends keyof React.JSX.IntrinsicElements = "svg",
> extends DOMRenderProps<E, undefined> {
  children?: React.ReactNode;
  className?: string;
}

const AutocompleteIndicator = <E extends keyof React.JSX.IntrinsicElements = "svg">({
  children,
  className,
  ...props
}: AutocompleteIndicatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AutocompleteIndicatorProps<E>>) => {
  const {slots} = use(AutocompleteContext);
  const state = use(SelectStateContext);

  if (children && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement<{
        className?: string;
        "data-slot"?: "autocomplete-indicator";
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
        "data-slot": "autocomplete-indicator",
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
      data-slot="autocomplete-default-indicator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Clear Button
 * -----------------------------------------------------------------------------------------------*/
interface AutocompleteClearButtonProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const AutocompleteClearButton = <E extends keyof React.JSX.IntrinsicElements = "span">({
  children,
  className,
  onClick,
  onPointerDown,
  ...props
}: AutocompleteClearButtonProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof AutocompleteClearButtonProps<E>>) => {
  const {isDisabled: rootDisabled, onClear, registerClearButton, slots} = use(AutocompleteContext);
  const {isDisabled: triggerDisabled} = use(AutocompleteTriggerContext);
  const state = use(SelectStateContext);

  const isDisabled = triggerDisabled ?? rootDisabled ?? false;
  const isEmpty = isSelectionEmpty(state);

  // Opts the trigger into the Backspace/Delete shortcut, which is how keyboard and
  // screen reader users clear. See AutocompleteTrigger.
  React.useEffect(() => registerClearButton?.(), [registerClearButton]);

  const handlePointerDown = (e: React.PointerEvent<HTMLSpanElement>) => {
    // Autocomplete.Trigger is a <button>, and nesting a <button> in one is invalid HTML, so
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
      data-slot="autocomplete-clear-button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
    >
      {children ?? <CloseIcon data-slot="autocomplete-clear-button-icon" />}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Popover
 * -----------------------------------------------------------------------------------------------*/
interface AutocompletePopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children"
> {
  children: React.ReactNode;
}

const AutocompletePopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: AutocompletePopoverProps) => {
  const {slots} = use(AutocompleteContext);

  return (
    <SurfaceContext
      value={{
        variant: "default" as SurfaceVariants["variant"],
      }}
    >
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="autocomplete-popover"
        placement={placement}
      >
        {children}
      </PopoverPrimitive>
    </SurfaceContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Autocomplete Filter
 * -----------------------------------------------------------------------------------------------*/
/*
 * RAC's Autocomplete renders no element: it wires a search field to a collection through
 * context and filters the collection, so this part has no data-slot or class to carry.
 *
 * PeakUI default: RAC filters nothing without a `filter`, so the part supplies a locale-aware,
 * case- and accent-insensitive "contains" match, which keeps the common composition free of a
 * hook import. A consumer that filters the data itself (the loading case) passes
 * `filter={() => true}`.
 */
interface AutocompleteFilterProps extends ComponentPropsWithRef<typeof AutocompletePrimitive> {}

const AutocompleteFilter = ({children, filter, ...props}: AutocompleteFilterProps) => {
  const {contains} = useFilter({sensitivity: "base"});

  return (
    <AutocompletePrimitive {...props} filter={filter ?? contains}>
      {children}
    </AutocompletePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  AutocompleteRoot,
  AutocompleteTrigger,
  AutocompleteValue,
  AutocompleteIndicator,
  AutocompleteClearButton,
  AutocompletePopover,
  AutocompleteFilter,
};

export type {
  AutocompleteRootProps,
  AutocompleteTriggerProps,
  AutocompleteValueProps,
  AutocompleteIndicatorProps,
  AutocompleteClearButtonProps,
  AutocompletePopoverProps,
  AutocompleteFilterProps,
};

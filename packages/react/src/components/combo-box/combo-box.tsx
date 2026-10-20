"use client";

import type {FieldVariant} from "../../contexts/field-variant.ts";
import type {SurfaceVariants} from "../surface/index.ts";
import type {ComboBoxVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {comboBoxVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {useIsHidden} from "react-aria/private/collections/Hidden";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {
  ComboBox as ComboBoxPrimitive,
  ComboBoxStateContext,
  ComboBoxValue as ComboBoxValuePrimitive,
} from "react-aria-components/ComboBox";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {Popover as PopoverPrimitive} from "react-aria-components/Popover";

import {FieldVariantContext} from "../../contexts/field-variant.ts";
import {dataAttr} from "../../utils/assertion.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";
import {FieldSlotsGate} from "../../utils/field-slots-gate.tsx";
import {IconChevronDown} from "../icons.tsx";
import {SurfaceContext} from "../surface/index.ts";

/* -------------------------------------------------------------------------------------------------
 * ComboBox Context
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxContextValue {
  slots?: ReturnType<typeof comboBoxVariants>;
}

const ComboBoxContext = createContext<ComboBoxContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * ComboBox Root
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxRootProps<T extends object, M extends "single" | "multiple" = "single">
  extends ComponentPropsWithRef<typeof ComboBoxPrimitive<T, M>>, ComboBoxVariants {
  items?: Iterable<T>;
  /**
   * The variant of the field surface. It reaches the `Input` inside through the field variant
   * context.
   * @default "primary"
   */
  variant?: FieldVariant;
}

const ComboBoxRoot = <T extends object = object, M extends "single" | "multiple" = "single">({
  children,
  className,
  fullWidth,
  menuTrigger = "focus",
  variant,
  ...props
}: ComboBoxRootProps<T, M>) => {
  const slots = useMemo(() => comboBoxVariants({fullWidth}), [fullWidth]);
  const contextValue = useMemo<ComboBoxContextValue>(() => ({slots}), [slots]);
  /*
   * The raw prop, possibly undefined: providing it always is what resets an inherited variant
   * for a nested field (docs/superpowers/specs/2026-10-03-input-field-family-design, 1.1).
   */
  const fieldVariant = useMemo(() => ({variant}), [variant]);

  return (
    <FieldSlotsGate>
      <ComboBoxContext value={contextValue}>
        <ComboBoxPrimitive
          menuTrigger={menuTrigger}
          {...props}
          className={composeTwRenderProps(className, slots?.base())}
          data-slot="combo-box"
        >
          {(values) => (
            <FieldVariantContext value={fieldVariant}>
              {typeof children === "function" ? children(values) : children}
            </FieldVariantContext>
          )}
        </ComboBoxPrimitive>
      </ComboBoxContext>
    </FieldSlotsGate>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ComboBox Input Group
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxInputGroupProps extends ComponentPropsWithRef<typeof GroupPrimitive> {}

const ComboBoxInputGroup = ({children, className, ...props}: ComboBoxInputGroupProps) => {
  const {slots} = use(ComboBoxContext);
  const isHidden = useIsHidden();

  /*
   * ComboBox renders its children once more, hidden, to collect the list items. The group
   * carries no items, so that pass skips it: otherwise a second group and a second trigger
   * would be built inside the hidden tree.
   */
  if (isHidden) {
    return null;
  }

  return (
    <GroupPrimitive
      className={composeTwRenderProps(className, slots?.inputGroup())}
      {...props}
      data-slot="combo-box-input-group"
    >
      {children}
    </GroupPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ComboBox Value
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxValueProps<T extends object> extends ComponentPropsWithRef<
  typeof ComboBoxValuePrimitive<T>
> {}

const ComboBoxValue = <T extends object = object>({
  children,
  className,
  ...props
}: ComboBoxValueProps<T>) => {
  const {slots} = use(ComboBoxContext);

  return (
    <ComboBoxValuePrimitive
      className={composeTwRenderProps(className, slots?.value())}
      {...props}
      data-slot="combo-box-value"
    >
      {children}
    </ComboBoxValuePrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ComboBox Trigger
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxTriggerProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const ComboBoxTrigger = ({children, className, ...props}: ComboBoxTriggerProps) => {
  const {slots} = use(ComboBoxContext);
  const state = use(ComboBoxStateContext);
  const isHidden = useIsHidden();

  if (isHidden) {
    return null;
  }

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.trigger())}
      data-open={dataAttr(state?.isOpen)}
      {...props}
      data-slot="combo-box-trigger"
    >
      {(values) => {
        const content: ReactNode = typeof children === "function" ? children(values) : children;

        return content ?? <IconChevronDown data-slot="combo-box-trigger-default-icon" />;
      }}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ComboBox Popover
 * -----------------------------------------------------------------------------------------------*/
interface ComboBoxPopoverProps extends Omit<
  ComponentPropsWithRef<typeof PopoverPrimitive>,
  "children"
> {
  children: ReactNode;
}

const ComboBoxPopover = ({
  children,
  className,
  placement = "bottom",
  ...props
}: ComboBoxPopoverProps) => {
  const {slots} = use(ComboBoxContext);

  return (
    <SurfaceContext
      value={{
        variant: "default" as SurfaceVariants["variant"],
      }}
    >
      <PopoverPrimitive
        {...props}
        className={composeTwRenderProps(className, slots?.popover())}
        data-slot="combo-box-popover"
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
export {ComboBoxRoot, ComboBoxInputGroup, ComboBoxValue, ComboBoxTrigger, ComboBoxPopover};

export type {
  ComboBoxRootProps,
  ComboBoxInputGroupProps,
  ComboBoxValueProps,
  ComboBoxTriggerProps,
  ComboBoxPopoverProps,
};

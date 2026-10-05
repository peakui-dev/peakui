"use client";

import type {NumberFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {numberFieldVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {Button as ButtonPrimitive} from "react-aria-components/Button";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {Input as InputPrimitive} from "react-aria-components/Input";
import {NumberField as NumberFieldPrimitive} from "react-aria-components/NumberField";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {IconMinus, IconPlus} from "../icons.tsx";

/* -------------------------------------------------------------------------------------------------
 * NumberField Context
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldContextValue {
  slots?: ReturnType<typeof numberFieldVariants>;
}

const NumberFieldContext = createContext<NumberFieldContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * NumberField Root
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldRootProps
  extends ComponentPropsWithRef<typeof NumberFieldPrimitive>, NumberFieldVariants {}

const NumberFieldRoot = ({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: NumberFieldRootProps) => {
  const slots = React.useMemo(
    () => numberFieldVariants({fullWidth, variant}),
    [fullWidth, variant],
  );
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <NumberFieldContext value={contextValue}>
      <NumberFieldPrimitive
        className={composeTwRenderProps(className, slots?.base())}
        {...props}
        data-slot="number-field"
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </NumberFieldPrimitive>
    </NumberFieldContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * NumberField Group
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldGroupProps extends ComponentPropsWithRef<typeof GroupPrimitive> {}

const NumberFieldGroup = ({children, className, ...props}: NumberFieldGroupProps) => {
  const {slots} = use(NumberFieldContext);

  return (
    <GroupPrimitive
      className={composeTwRenderProps(className, slots?.group())}
      {...props}
      data-slot="number-field-group"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </GroupPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * NumberField Input
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldInputProps extends ComponentPropsWithRef<typeof InputPrimitive> {}

const NumberFieldInput = ({className, ...props}: NumberFieldInputProps) => {
  const {slots} = use(NumberFieldContext);

  return (
    <InputPrimitive
      className={composeTwRenderProps(className, slots?.input())}
      {...props}
      data-slot="number-field-input"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * NumberField Increment Button
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldIncrementButtonProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const NumberFieldIncrementButton = ({
  children,
  className,
  ...props
}: NumberFieldIncrementButtonProps) => {
  const {slots} = use(NumberFieldContext);

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.incrementButton())}
      slot="increment"
      {...props}
      data-slot="number-field-increment-button"
    >
      {children && React.isValidElement(children) ? (
        children
      ) : (
        <IconPlus data-slot="number-field-increment-button-icon" />
      )}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * NumberField Decrement Button
 * -----------------------------------------------------------------------------------------------*/
interface NumberFieldDecrementButtonProps extends ComponentPropsWithRef<typeof ButtonPrimitive> {}

const NumberFieldDecrementButton = ({
  children,
  className,
  ...props
}: NumberFieldDecrementButtonProps) => {
  const {slots} = use(NumberFieldContext);

  return (
    <ButtonPrimitive
      className={composeTwRenderProps(className, slots?.decrementButton())}
      slot="decrement"
      {...props}
      data-slot="number-field-decrement-button"
    >
      {children && React.isValidElement(children) ? (
        children
      ) : (
        <IconMinus data-slot="number-field-decrement-button-icon" />
      )}
    </ButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  NumberFieldDecrementButton,
  NumberFieldGroup,
  NumberFieldIncrementButton,
  NumberFieldInput,
  NumberFieldRoot,
};

export type {
  NumberFieldRootProps,
  NumberFieldGroupProps,
  NumberFieldInputProps,
  NumberFieldIncrementButtonProps,
  NumberFieldDecrementButtonProps,
};

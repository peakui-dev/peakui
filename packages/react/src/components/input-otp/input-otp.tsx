"use client";

import type {InputOtpVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {ValidationResult} from "react-aria-components/CheckboxGroup";

import {inputOtpVariants} from "@peakui/styles";
import {OTPInput, OTPInputContext} from "input-otp";
import React, {createContext, use} from "react";
import {FieldErrorContext} from "react-aria-components/FieldError";

import {dataAttr} from "../../utils/assertion.ts";
import {composeSlotClassName} from "../../utils/compose.ts";

const EMPTY_VALIDATION_ERRORS: string[] = [];

/* -------------------------------------------------------------------------------------------------
 * InputOtp Context
 * -----------------------------------------------------------------------------------------------*/
interface InputOtpContextValue {
  slots?: ReturnType<typeof inputOtpVariants>;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

const InputOtpContext = createContext<InputOtpContextValue>({
  isDisabled: false,
  isInvalid: false,
});

/* -------------------------------------------------------------------------------------------------
 * InputOtp Root
 * -------------------------------------------------------------------------------------------------
 * A thin composition over the third-party OTPInput: paste handling, the fake caret and slot state
 * all belong to that package and are never re-derived here. Two of its prop conventions are
 * adapted rather than restated: `className` reaches the hidden <input>, so the wrapper routes our
 * BEM slots the other way — slots.input to `className`, slots.base to `containerClassName`.
 * -----------------------------------------------------------------------------------------------*/
interface InputOtpRootProps
  extends
    Omit<ComponentPropsWithRef<typeof OTPInput>, "disabled" | "containerClassName" | "render">,
    InputOtpVariants {
  isDisabled?: boolean;
  isInvalid?: boolean;
  validationErrors?: string[];
  validationDetails?: ValidityState;
  inputClassName?: string;
  children: ReactNode;
}

const InputOtpRoot = ({
  className,
  inputClassName,
  isDisabled = false,
  isInvalid = false,
  validationDetails,
  validationErrors = EMPTY_VALIDATION_ERRORS,
  variant,
  ...props
}: InputOtpRootProps) => {
  const slots = React.useMemo(() => inputOtpVariants({variant}), [variant]);

  /*
   * The Root injects a synthetic ValidationResult into RAC's FieldErrorContext, so the
   * already-shipped FieldError renders inside InputOtp without a RAC form field around it.
   */
  const validation = React.useMemo(
    () =>
      ({
        isInvalid,
        validationDetails,
        validationErrors,
      }) as ValidationResult,
    [isInvalid, validationDetails, validationErrors],
  );
  const contextValue = React.useMemo(
    () => ({isDisabled, isInvalid, slots}),
    [isDisabled, isInvalid, slots],
  );

  return (
    <InputOtpContext value={contextValue}>
      <FieldErrorContext value={validation}>
        <OTPInput
          className={slots.input({className: inputClassName})}
          containerClassName={slots.base({className})}
          data-disabled={dataAttr(isDisabled)}
          data-invalid={dataAttr(isInvalid)}
          disabled={isDisabled}
          {...props}
          data-slot="input-otp"
        />
      </FieldErrorContext>
    </InputOtpContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputOtp Group
 * -----------------------------------------------------------------------------------------------*/
interface InputOtpGroupProps extends ComponentPropsWithRef<"div"> {}

const InputOtpGroup = ({className, ...props}: InputOtpGroupProps) => {
  const {slots} = use(InputOtpContext);

  return (
    <div
      className={composeSlotClassName(slots?.group, className)}
      {...props}
      data-slot="input-otp-group"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputOtp Slot
 * -----------------------------------------------------------------------------------------------*/
interface InputOtpSlotProps extends ComponentPropsWithRef<"div"> {
  index: number;
}

const InputOtpSlot = ({className, index, ...props}: InputOtpSlotProps) => {
  const {isDisabled, isInvalid, slots} = use(InputOtpContext);

  const inputOtpContext = use(OTPInputContext);
  const {char, hasFakeCaret, isActive} = inputOtpContext?.slots[index] ?? {};

  return (
    <div
      {...props}
      className={composeSlotClassName(slots?.slot, className)}
      data-active={dataAttr(isActive)}
      data-disabled={dataAttr(isDisabled)}
      data-filled={dataAttr(!!char)}
      data-invalid={dataAttr(isInvalid)}
      data-slot="input-otp-slot"
    >
      {char ? (
        <div className={slots?.slotValue()} data-slot="input-otp-slot-value">
          {char}
        </div>
      ) : null}
      {hasFakeCaret && isActive ? (
        <div className={slots?.caret()} data-slot="input-otp-caret" />
      ) : null}
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * InputOtp Separator
 * -----------------------------------------------------------------------------------------------*/
interface InputOtpSeparatorProps extends ComponentPropsWithRef<"div"> {}

const InputOtpSeparator = ({className, ...props}: InputOtpSeparatorProps) => {
  const {slots} = use(InputOtpContext);

  return (
    <div
      className={composeSlotClassName(slots?.separator, className)}
      {...props}
      data-slot="input-otp-separator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {InputOtpGroup, InputOtpRoot, InputOtpSeparator, InputOtpSlot};

export type {InputOtpGroupProps, InputOtpRootProps, InputOtpSeparatorProps, InputOtpSlotProps};

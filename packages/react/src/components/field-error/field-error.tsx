"use client";

import type {FieldErrorVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {fieldErrorVariants} from "@peakui/styles";
import {FieldError as FieldErrorPrimitive} from "react-aria-components/FieldError";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Field Error Root
 * -------------------------------------------------------------------------------------------------
 * Примитив RAC рендерит сообщение только у невалидного поля и сам связывает его с контролом через
 * aria-describedby. Отсюда безусловный data-visible: «отрендерен» и «виден» здесь одно и то же, а
 * схлопнутая высота в CSS нужна, чтобы появление не дёргало содержимое ниже.
 * -----------------------------------------------------------------------------------------------*/
interface FieldErrorRootProps
  extends ComponentPropsWithRef<typeof FieldErrorPrimitive>, FieldErrorVariants {}

const FieldErrorRoot = ({children, className, ...rest}: FieldErrorRootProps) => {
  return (
    <FieldErrorPrimitive
      data-visible
      className={composeTwRenderProps(className, fieldErrorVariants())}
      data-slot="field-error"
      {...rest}
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </FieldErrorPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {FieldErrorRoot};

export type {FieldErrorRootProps};

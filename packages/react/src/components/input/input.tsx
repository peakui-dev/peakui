"use client";

import type {InputVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {inputVariants} from "@peakui/styles";
import {Input as InputPrimitive} from "react-aria-components/Input";

import {useFieldVariant} from "../../contexts/field-variant.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Input Root
 * -------------------------------------------------------------------------------------------------
 * Тонкая стилизованная композиция над примитивом RAC. Значение, фокус, клавиатура, ARIA и
 * data-атрибуты состояний — его; здесь добавляются только имена, стиль и наследование варианта.
 *
 * variant читается из FieldVariantContext, а не из контекста конкретного корня поля: эталон в этом
 * месте читает сразу два контекста (TextFieldContext и ComboBoxContext) и обязан дописывать третий
 * на каждое новое поле. Причины расхождения — спека 2026-10-03-input-field-family-design, 1.1.
 * -----------------------------------------------------------------------------------------------*/
interface InputRootProps extends ComponentPropsWithRef<typeof InputPrimitive>, InputVariants {}

const InputRoot = ({className, fullWidth, variant, ...rest}: InputRootProps) => {
  const inherited = useFieldVariant();
  const styles = inputVariants({fullWidth, variant: variant ?? inherited.variant});

  return (
    <InputPrimitive
      className={composeTwRenderProps(className, styles)}
      data-slot="input"
      {...rest}
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {InputRoot};

export type {InputRootProps};

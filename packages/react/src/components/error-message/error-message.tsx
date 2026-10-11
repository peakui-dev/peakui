"use client";

import type {ErrorMessageVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {TextProps} from "react-aria-components/Text";

import {errorMessageVariants} from "@peakui/styles";
import {Text} from "react-aria-components/Text";

import {useHasTextSlot} from "../../hooks/use-has-text-slot.ts";

/* -------------------------------------------------------------------------------------------------
 * Error Message Root
 * -----------------------------------------------------------------------------------------------*
 * slot="errorMessage" — всё, что нужно для связки: id и aria-describedby выдаёт корень поля через
 * TextContext, компонент их не трогает.
 *
 * Не FieldError: тот рендерит ошибки валидации RAC (isInvalid, validationErrors) у полей форм.
 * Этот компонент — предъявление объявленного родителем текстового слота errorMessage, без
 * собственной валидации; его место — коллекционные корни вроде TagGroup.
 *
 * null внутри гейта — не оптимизация: корень-коллекция RAC монтирует скрытое дерево до появления
 * слотов, и сообщение отрендерилось бы в нём. Подробности — в hooks/use-has-text-slot.ts.
 * -----------------------------------------------------------------------------------------------*/
interface ErrorMessageRootProps
  extends ComponentPropsWithRef<typeof Text>, TextProps, ErrorMessageVariants {}

const ErrorMessageRoot = ({children, className, ...rest}: ErrorMessageRootProps) => {
  const hasSlot = useHasTextSlot("errorMessage");

  if (!hasSlot) {
    return null;
  }

  return (
    <Text
      className={errorMessageVariants({className})}
      slot="errorMessage"
      {...rest}
      data-slot="error-message"
    >
      {children}
    </Text>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ErrorMessageRoot};

export type {ErrorMessageRootProps};

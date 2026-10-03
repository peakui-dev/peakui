"use client";

import type {DescriptionVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {TextProps} from "react-aria-components/Text";

import {descriptionVariants} from "@peakui/styles";
import {Text} from "react-aria-components/Text";

import {useHasTextSlot} from "../../hooks/use-has-text-slot.ts";

/* -------------------------------------------------------------------------------------------------
 * Description Root
 * -------------------------------------------------------------------------------------------------
 * slot="description" — всё, что нужно для связки: id и aria-describedby выдаёт корень поля через
 * TextContext, компонент их не трогает.
 *
 * null внутри гейта — не оптимизация: корень-коллекция RAC монтирует скрытое дерево до появления
 * слотов, и описание отрендерилось бы в нём. Подробности — в hooks/use-has-text-slot.ts.
 * -----------------------------------------------------------------------------------------------*/
interface DescriptionRootProps
  extends ComponentPropsWithRef<typeof Text>, TextProps, DescriptionVariants {}

const DescriptionRoot = ({children, className, ...rest}: DescriptionRootProps) => {
  const hasSlot = useHasTextSlot("description");

  if (!hasSlot) {
    return null;
  }

  return (
    <Text
      className={descriptionVariants({className})}
      data-slot="description"
      slot="description"
      {...rest}
    >
      {children}
    </Text>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {DescriptionRoot};

export type {DescriptionRootProps};

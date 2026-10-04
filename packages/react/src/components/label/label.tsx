"use client";

import type {LabelVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {labelVariants} from "@peakui/styles";
import {Label as LabelPrimitive} from "react-aria-components/Label";

/* -------------------------------------------------------------------------------------------------
 * Label Root
 * -------------------------------------------------------------------------------------------------
 * Три булевых пропа — для подписи ВНЕ поля, в разметке, где состояние передать некому. Внутри
 * TextField их передавать не нужно: RAC ставит data-required / data-disabled / data-invalid на
 * корень, а label.css каскадирует от него. Так потребитель не дублирует состояние дважды.
 * -----------------------------------------------------------------------------------------------*/
interface LabelRootProps extends ComponentPropsWithRef<typeof LabelPrimitive>, LabelVariants {}

const LabelRoot = ({
  children,
  className,
  isDisabled,
  isInvalid,
  isRequired,
  ...rest
}: LabelRootProps) => {
  return (
    <LabelPrimitive
      className={labelVariants({className, isDisabled, isInvalid, isRequired})}
      {...rest}
      data-slot="label"
    >
      {children}
    </LabelPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {LabelRoot};

export type {LabelRootProps};

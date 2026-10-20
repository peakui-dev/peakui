"use client";

import type {DateFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {DateValue} from "react-aria-components/Calendar";

import {dateFieldVariants} from "@peakui/styles";
import {useMemo} from "react";
import {DateField as DateFieldPrimitive} from "react-aria-components/DateField";

import {dataAttr} from "../../utils/assertion.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * DateField Root
 * -----------------------------------------------------------------------------------------------*/
interface DateFieldRootProps<T extends DateValue>
  extends ComponentPropsWithRef<typeof DateFieldPrimitive<T>>, DateFieldVariants {}

const DateFieldRoot = <T extends DateValue>({
  children,
  className,
  fullWidth,
  ...props
}: DateFieldRootProps<T>) => {
  const styles = useMemo(() => dateFieldVariants({fullWidth}), [fullWidth]);

  return (
    <DateFieldPrimitive
      data-required={dataAttr(props.isRequired)}
      {...props}
      className={composeTwRenderProps(className, styles)}
      data-slot="date-field"
    >
      {children}
    </DateFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {DateFieldRoot};

export type {DateFieldRootProps};

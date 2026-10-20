"use client";

import type {TimeFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {TimeValue} from "react-aria-components/TimeField";

import {timeFieldVariants} from "@peakui/styles";
import {useMemo} from "react";
import {TimeField as TimeFieldPrimitive} from "react-aria-components/TimeField";

import {dataAttr} from "../../utils/assertion.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * TimeField Root
 * -----------------------------------------------------------------------------------------------*/
interface TimeFieldRootProps<T extends TimeValue>
  extends ComponentPropsWithRef<typeof TimeFieldPrimitive<T>>, TimeFieldVariants {}

const TimeFieldRoot = <T extends TimeValue>({
  children,
  className,
  fullWidth,
  ...props
}: TimeFieldRootProps<T>) => {
  const styles = useMemo(() => timeFieldVariants({fullWidth}), [fullWidth]);

  return (
    <TimeFieldPrimitive
      data-required={dataAttr(props.isRequired)}
      {...props}
      className={composeTwRenderProps(className, styles)}
      data-slot="time-field"
    >
      {children}
    </TimeFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {TimeFieldRoot};

export type {TimeFieldRootProps};

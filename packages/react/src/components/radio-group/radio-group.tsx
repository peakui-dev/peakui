"use client";

import type {RadioGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {radioGroupVariants} from "@peakui/styles";
import React from "react";
import {RadioGroup as RadioGroupPrimitive} from "react-aria-components/RadioGroup";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Radio Group Root
 * -----------------------------------------------------------------------------------------------*/
interface RadioGroupRootProps
  extends ComponentPropsWithRef<typeof RadioGroupPrimitive>, RadioGroupVariants {}

const RadioGroupRoot = ({children, className, variant, ...props}: RadioGroupRootProps) => {
  const styles = React.useMemo(() => radioGroupVariants({variant}), [variant]);

  return (
    <RadioGroupPrimitive
      className={composeTwRenderProps(className, styles)}
      {...props}
      data-slot="radio-group"
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </RadioGroupPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {RadioGroupRoot};

export type {RadioGroupRootProps};

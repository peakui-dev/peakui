"use client";

import type {CheckboxGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {checkboxGroupVariants} from "@peakui/styles";
import React from "react";
import {CheckboxGroup as CheckboxGroupPrimitive} from "react-aria-components/CheckboxGroup";

import {composeTwRenderProps} from "../../utils/compose.ts";

import {CheckboxGroupContext} from "./checkbox-group-context.ts";

interface CheckboxGroupRootProps
  extends ComponentPropsWithRef<typeof CheckboxGroupPrimitive>, CheckboxGroupVariants {}

const CheckboxGroupRoot = ({children, className, variant, ...props}: CheckboxGroupRootProps) => {
  const styles = React.useMemo(() => checkboxGroupVariants({variant}), [variant]);

  return (
    <CheckboxGroupContext value={{variant}}>
      <CheckboxGroupPrimitive
        className={composeTwRenderProps(className, styles)}
        {...props}
        data-slot="checkbox-group"
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </CheckboxGroupPrimitive>
    </CheckboxGroupContext>
  );
};

export {CheckboxGroupRoot};
export type {CheckboxGroupRootProps};

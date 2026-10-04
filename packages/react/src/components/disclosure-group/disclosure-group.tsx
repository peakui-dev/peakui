"use client";

import type {DisclosureGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {disclosureGroupVariants} from "@peakui/styles";
import React, {createContext} from "react";
import {DisclosureGroup as DisclosureGroupPrimitive} from "react-aria-components/DisclosureGroup";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Disclosure Group Context
 * -----------------------------------------------------------------------------------------------*/
type DisclosureGroupContext = {
  slots?: ReturnType<typeof disclosureGroupVariants>;
};

const DisclosureGroupContext = createContext<DisclosureGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * Disclosure Group Root
 * -----------------------------------------------------------------------------------------------*/
interface DisclosureGroupRootProps
  extends ComponentPropsWithRef<typeof DisclosureGroupPrimitive>, DisclosureGroupVariants {}

const DisclosureGroupRoot = ({children, className, ...props}: DisclosureGroupRootProps) => {
  const slots = React.useMemo(() => disclosureGroupVariants({}), []);

  const contextValue = React.useMemo(() => ({slots}), [slots]);

  return (
    <DisclosureGroupContext value={contextValue}>
      <DisclosureGroupPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="disclosure-group"
      >
        {(values) => <>{typeof children === "function" ? children(values) : children}</>}
      </DisclosureGroupPrimitive>
    </DisclosureGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {DisclosureGroupRoot};

export type {DisclosureGroupRootProps};

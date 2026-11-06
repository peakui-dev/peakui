"use client";

import type {SheetVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {sheetVariants} from "@peakui/styles";
import {Sheet as SheetPrimitive} from "react-aria-components/Sheet";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Sheet Root
 * -----------------------------------------------------------------------------------------------*/
interface SheetRootProps extends ComponentPropsWithRef<typeof SheetPrimitive>, SheetVariants {}

/*
 * composeTwRenderProps is for a primitive whose className may be a function of its state. A
 * primitive that takes a string only (Label, Heading, Dialog) gets
 * `className={sheetVariants({className})}` instead.
 */
const SheetRoot = ({children, className, ...rest}: SheetRootProps) => {
  return (
    <SheetPrimitive
      className={composeTwRenderProps(className, sheetVariants().overlay())}
      {...rest}
      data-slot="sheet"
    >
      {children}
    </SheetPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SheetRoot};

export type {SheetRootProps};

"use client";

import type {ListBoxVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {listBoxVariants} from "@peakui/styles";
import React from "react";
import {ListBox as ListBoxPrimitive} from "react-aria-components/ListBox";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * ListBox Root
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxRootProps<T extends object>
  extends ComponentPropsWithRef<typeof ListBoxPrimitive<T>>, ListBoxVariants {
  className?: string;
}

const ListBoxRoot = <T extends object>({className, variant, ...props}: ListBoxRootProps<T>) => {
  const styles = React.useMemo(() => listBoxVariants({variant}), [variant]);

  return (
    <ListBoxPrimitive
      className={composeTwRenderProps(className, styles)}
      {...props}
      data-slot="list-box"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxRoot};

export type {ListBoxRootProps};

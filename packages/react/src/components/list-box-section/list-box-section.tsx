"use client";

import type {ListBoxSectionVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {listBoxSectionVariants} from "@peakui/styles";
import React from "react";
import {ListBoxSection as ListBoxSectionPrimitive} from "react-aria-components/ListBox";

/* -------------------------------------------------------------------------------------------------
 * ListBox Section Root
 * -----------------------------------------------------------------------------------------------*/
interface ListBoxSectionRootProps
  extends ComponentPropsWithRef<typeof ListBoxSectionPrimitive>, ListBoxSectionVariants {
  className?: string;
}

const ListBoxSectionRoot = ({children, className, ...props}: ListBoxSectionRootProps) => {
  const styles = React.useMemo(() => listBoxSectionVariants({className}), [className]);

  return (
    <ListBoxSectionPrimitive {...props} className={styles} data-slot="list-box-section">
      {children}
    </ListBoxSectionPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ListBoxSectionRoot};

export type {ListBoxSectionRootProps};

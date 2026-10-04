"use client";

import type {SeparatorVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {separatorVariants} from "@peakui/styles";
import {SeparatorContext, Separator as SeparatorPrimitive} from "react-aria-components/Separator";
import {useSlottedContext} from "react-aria-components/slots";

/* -------------------------------------------------------------------------------------------------
 * Separator Root
 * -----------------------------------------------------------------------------------------------*/
interface SeparatorRootProps
  extends ComponentPropsWithRef<typeof SeparatorPrimitive>, SeparatorVariants {}

const SeparatorRoot = ({className, orientation, variant, ...props}: SeparatorRootProps) => {
  const context = useSlottedContext(SeparatorContext);
  const resolvedOrientation = orientation ?? context?.orientation ?? "horizontal";

  return (
    <SeparatorPrimitive
      data-orientation={resolvedOrientation}
      orientation={resolvedOrientation}
      className={separatorVariants({
        orientation: resolvedOrientation,
        variant,
        className,
      })}
      {...props}
      data-slot="separator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SeparatorRoot};

export type {SeparatorRootProps};

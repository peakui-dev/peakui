"use client";

import type {ColorFieldVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {Color} from "react-aria-components/ColorField";

import {colorFieldVariants} from "@peakui/styles";
import {useMemo} from "react";
import {ColorField as ColorFieldPrimitive} from "react-aria-components/ColorField";

import {dataAttr} from "../../utils/assertion.ts";
import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * ColorField Root
 * -----------------------------------------------------------------------------------------------*/
interface ColorFieldRootProps
  extends ComponentPropsWithRef<typeof ColorFieldPrimitive>, ColorFieldVariants {}

const ColorFieldRoot = ({children, className, fullWidth, ...props}: ColorFieldRootProps) => {
  const styles = useMemo(() => colorFieldVariants({fullWidth}), [fullWidth]);

  return (
    <ColorFieldPrimitive
      data-required={dataAttr(props.isRequired)}
      {...props}
      className={composeTwRenderProps(className, styles)}
      data-slot="color-field"
    >
      {children}
    </ColorFieldPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ColorFieldRoot};

export type {ColorFieldRootProps, Color as ColorValue};

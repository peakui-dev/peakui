"use client";

import type {ToggleButtonVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {toggleButtonVariants} from "@peakui/styles";
import {use} from "react";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";

import {composeTwRenderProps} from "../../utils/compose.ts";
import {ToggleButtonGroupContext} from "../toggle-button-group/index.ts";

/* -------------------------------------------------------------------------------------------------
 * ToggleButton Root
 * -------------------------------------------------------------------------------------------------
 * A thin styled composition over the RAC ToggleButton primitive. Behavior, focus, keyboard and
 * ARIA are the primitive's; this adds the BEM names and the group's size when the button renders
 * inside a ToggleButtonGroup. Selection semantics belong to the primitive: standalone the button
 * toggles itself; inside a group the group owns the selection.
 * -----------------------------------------------------------------------------------------------*/
interface ToggleButtonRootProps
  extends ComponentPropsWithRef<typeof ToggleButtonPrimitive>, ToggleButtonVariants {}

const ToggleButtonRoot = ({
  children,
  className,
  isIconOnly,
  size,
  variant,
  ...rest
}: ToggleButtonRootProps) => {
  const groupContext = use(ToggleButtonGroupContext);

  // Merge props with precedence: direct props > context props
  const finalSize = size ?? groupContext?.size;

  const styles = toggleButtonVariants({
    isIconOnly,
    size: finalSize,
    variant,
  });

  return (
    <ToggleButtonPrimitive
      className={composeTwRenderProps(className, styles)}
      {...rest}
      data-slot="toggle-button"
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </ToggleButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ToggleButtonRoot};

export type {ToggleButtonRootProps};

"use client";

import type {ToolbarVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {toolbarVariants} from "@peakui/styles";
import {useMemo} from "react";
import {SeparatorContext} from "react-aria-components/Separator";
import {ToggleButtonGroupContext} from "react-aria-components/ToggleButtonGroup";
import {Toolbar as ToolbarPrimitive} from "react-aria-components/Toolbar";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * Toolbar Root
 * -------------------------------------------------------------------------------------------------
 * The RAC Toolbar primitive owns role="toolbar", arrow-key navigation and aria-orientation. This
 * Root adds the BEM names and hands its orientation down: a ToggleButtonGroup inside inherits it,
 * and a Separator inside takes the perpendicular one, so it divides rather than runs along.
 * -----------------------------------------------------------------------------------------------*/
interface ToolbarRootProps
  extends ComponentPropsWithRef<typeof ToolbarPrimitive>, ToolbarVariants {}

const ToolbarRoot = ({
  children,
  className,
  isAttached,
  orientation = "horizontal",
  ...rest
}: ToolbarRootProps) => {
  const base = useMemo(() => toolbarVariants({isAttached, orientation}), [isAttached, orientation]);
  const groupContext = useMemo(() => ({orientation}), [orientation]);
  const separatorContext = useMemo(
    () => ({orientation: orientation === "horizontal" ? "vertical" : "horizontal"}) as const,
    [orientation],
  );

  return (
    <ToggleButtonGroupContext value={groupContext}>
      <SeparatorContext value={separatorContext}>
        <ToolbarPrimitive
          className={composeTwRenderProps(className, base)}
          orientation={orientation}
          {...rest}
          data-slot="toolbar"
        >
          {children}
        </ToolbarPrimitive>
      </SeparatorContext>
    </ToggleButtonGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ToolbarRoot};

export type {ToolbarRootProps};

"use client";

import type {SegmentedControlVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {Key} from "react-aria-components/Collection";

import {segmentedControlVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";
import {ToggleButtonGroup as ToggleButtonGroupPrimitive} from "react-aria-components/ToggleButtonGroup";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * SegmentedControl Context
 * -------------------------------------------------------------------------------------------------
 * The Root computes the slots once and a part reads its own from here — the shape TabsContext uses.
 * It carries no `size`: size is a modifier on the Root, and the stylesheet reaches the segment by
 * descent. ToggleButtonGroup passes `size` through context because its ToggleButton also works
 * standalone; a segment never does.
 * -----------------------------------------------------------------------------------------------*/
type SegmentedControlContext = {
  slots?: ReturnType<typeof segmentedControlVariants>;
};

const SegmentedControlContext = createContext<SegmentedControlContext>({});

/* -------------------------------------------------------------------------------------------------
 * SegmentedControl Root
 * -------------------------------------------------------------------------------------------------
 * The RAC ToggleButtonGroup primitive owns selection, keyboard and ARIA; with
 * `selectionMode="single"` it renders a radiogroup whose items are radios. That mode and
 * `disallowEmptySelection` are fixed here and not exposed, so "segmented look plus multiple
 * selection plus one indicator" — a combination the indicator cannot express — is inexpressible.
 *
 * `orientation` is withheld for the same reason: v1 is horizontal only, and the primitive still
 * emits `data-orientation="horizontal"`, so adding the prop later is not a breaking change.
 * -----------------------------------------------------------------------------------------------*/
interface SegmentedControlRootProps
  extends
    Omit<
      ComponentPropsWithRef<typeof ToggleButtonGroupPrimitive>,
      | "defaultSelectedKeys"
      | "disallowEmptySelection"
      | "onSelectionChange"
      | "orientation"
      | "selectedKeys"
      | "selectionMode"
    >,
    SegmentedControlVariants {
  children: ReactNode;
  className?: string;
  /** Uncontrolled initial selection. */
  defaultSelectedKey?: Key;
  /** Controlled selection. */
  selectedKey?: Key;
  /**
   * Fires with the newly selected key. RAC hands a Set because its group supports multiple
   * selection; with the mode fixed that set always holds one key, so the key is unwrapped here.
   */
  onSelectionChange?: (key: Key) => void;
}

const SegmentedControlRoot = ({
  children,
  className,
  defaultSelectedKey,
  onSelectionChange,
  selectedKey,
  size,
  ...rest
}: SegmentedControlRootProps) => {
  const slots = React.useMemo(() => segmentedControlVariants({size}), [size]);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  /*
   * Only pass the key props the consumer actually supplied: an unconditional empty Set would make
   * an uncontrolled consumer permanently controlled-empty.
   */
  const selection = {
    ...(selectedKey === undefined ? {} : {selectedKeys: new Set([selectedKey])}),
    ...(defaultSelectedKey === undefined
      ? {}
      : {defaultSelectedKeys: new Set([defaultSelectedKey])}),
  };

  return (
    <SegmentedControlContext value={contextValue}>
      <ToggleButtonGroupPrimitive
        disallowEmptySelection
        className={composeTwRenderProps(className, slots.base())}
        selectionMode="single"
        {...selection}
        onSelectionChange={(keys) => {
          const key = keys.values().next().value;

          if (key !== undefined) onSelectionChange?.(key);
        }}
        {...rest}
        data-slot="segmented-control"
      >
        {children}
      </ToggleButtonGroupPrimitive>
    </SegmentedControlContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * SegmentedControl Item
 * -------------------------------------------------------------------------------------------------
 * One segment. Selection semantics belong to the group: the primitive reads the group's state by
 * the item's `id`, which is also the key in `selectedKey`.
 * -----------------------------------------------------------------------------------------------*/
interface SegmentedControlItemProps extends ComponentPropsWithRef<typeof ToggleButtonPrimitive> {
  className?: string;
}

const SegmentedControlItem = ({children, className, ...rest}: SegmentedControlItemProps) => {
  const {slots} = use(SegmentedControlContext);

  return (
    <ToggleButtonPrimitive
      className={composeTwRenderProps(className, slots?.item())}
      {...rest}
      data-slot="segmented-control-item"
    >
      {(renderProps) => (typeof children === "function" ? children(renderProps) : children)}
    </ToggleButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SegmentedControlRoot, SegmentedControlItem, SegmentedControlContext};

export type {SegmentedControlRootProps, SegmentedControlItemProps};

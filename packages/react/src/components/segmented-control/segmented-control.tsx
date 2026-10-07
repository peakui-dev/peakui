"use client";

import type {SegmentedControlVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";
import type {Key} from "react-aria-components/Collection";

import {segmentedControlVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {SelectionIndicator as SelectionIndicatorPrimitive} from "react-aria-components/SelectionIndicator";
import {ToggleButton as ToggleButtonPrimitive} from "react-aria-components/ToggleButton";
import {ToggleButtonGroup as ToggleButtonGroupPrimitive} from "react-aria-components/ToggleButtonGroup";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";

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

const SegmentedControlRoot = (props: SegmentedControlRootProps) => {
  const {children, className, defaultSelectedKey, onSelectionChange, selectedKey, size, ...rest} =
    props;

  const slots = React.useMemo(() => segmentedControlVariants({size}), [size]);
  const contextValue = React.useMemo(() => ({slots}), [slots]);

  /*
   * Controlled-ness is decided by the prop's PRESENCE, not by its value, so that a consumer can say
   * "controlled, nothing selected yet" — which is what a theme switcher needs before it knows the
   * resolved theme. Deciding by value instead would read that first render as uncontrolled and the
   * next one as controlled, and react-stately's useControlledState warns on exactly that transition
   * in every non-production build.
   *
   * The Sets are memoised because useToggleGroupState memoises on their identity: a fresh Set each
   * render defeats that memo and pushes a new selection object into group state every time.
   */
  const isControlled = "selectedKey" in props;
  const selectedKeys = React.useMemo(
    () => (isControlled ? new Set(selectedKey === undefined ? [] : [selectedKey]) : undefined),
    [isControlled, selectedKey],
  );
  const defaultSelectedKeys = React.useMemo(
    () => (defaultSelectedKey === undefined ? undefined : new Set([defaultSelectedKey])),
    [defaultSelectedKey],
  );

  return (
    <SegmentedControlContext value={contextValue}>
      {/*
       * `rest` is spread first so the locked props below cannot be overwritten through it. The type
       * already omits them, so this only closes the hole a cast would open — the order TabsRoot uses
       * for the same reason.
       */}
      <ToggleButtonGroupPrimitive
        {...rest}
        disallowEmptySelection
        className={composeTwRenderProps(className, slots.base())}
        data-slot="segmented-control"
        defaultSelectedKeys={defaultSelectedKeys}
        selectedKeys={selectedKeys}
        selectionMode="single"
        onSelectionChange={(keys) => {
          const key = keys.values().next().value;

          if (key !== undefined) onSelectionChange?.(key);
        }}
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
 *
 * The indicator is rendered here and is not an exported part. Unlike Tabs — where the consumer
 * places `<Tabs.Indicator />` because it has placement variants, a capsule in one variant and an
 * underline in another — a segment's indicator is always the capsule filling that segment. RAC
 * decides whether it is visible for a given item and animates it between items, so the render is
 * never gated on a selected check.
 * -----------------------------------------------------------------------------------------------*/
interface SegmentedControlItemProps extends Omit<
  ComponentPropsWithRef<typeof ToggleButtonPrimitive>,
  "id"
> {
  /*
   * Required, where the primitive leaves it optional. Without an `id` the RAC ToggleButton stops
   * consulting the group's state and falls back to a standalone toggle: `role="button"` with
   * `aria-pressed` inside a radiogroup, invisible to `selectedKey` and `onSelectionChange`, and its
   * indicator follows that local state — so two segments can show a capsule at once. It fails
   * silently, and the type is the only place to catch it.
   */
  id: Key;
  className?: string;
  /**
   * A segment whose whole content is an icon. It becomes square, so the capsule reads as a circle
   * rather than an oval — the geometry the house already uses for `.button--icon-only`. Give such a
   * segment its own `aria-label`: an icon carries no accessible name.
   */
  isIconOnly?: boolean;
}

const SegmentedControlItem = ({
  children,
  className,
  isIconOnly,
  ...rest
}: SegmentedControlItemProps) => {
  const {slots} = use(SegmentedControlContext);

  return (
    <ToggleButtonPrimitive
      className={composeTwRenderProps(className, slots?.item({isIconOnly}))}
      {...rest}
      data-slot="segmented-control-item"
    >
      {(renderProps) => (
        <>
          {typeof children === "function" ? children(renderProps) : children}
          <SelectionIndicatorPrimitive
            className={composeSlotClassName(slots?.indicator)}
            data-slot="segmented-control-indicator"
          />
        </>
      )}
    </ToggleButtonPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {SegmentedControlRoot, SegmentedControlItem, SegmentedControlContext};

export type {SegmentedControlRootProps, SegmentedControlItemProps};

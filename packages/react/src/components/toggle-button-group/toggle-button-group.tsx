"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ToggleButtonGroupVariants, ToggleButtonVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";

import {toggleButtonGroupVariants} from "@peakui/styles";
import React, {createContext, use} from "react";
import {useSlottedContext} from "react-aria-components/slots";
import {
  ToggleButtonGroupContext as RACToggleButtonGroupContext,
  ToggleButtonGroup as ToggleButtonGroupPrimitive,
} from "react-aria-components/ToggleButtonGroup";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Context
 * -------------------------------------------------------------------------------------------------
 * The slots are computed once in the Root; a part reads its own from here. `size` and
 * `isDisabled` propagate to child ToggleButtons — the button merges them with its own props,
 * direct props winning.
 * -----------------------------------------------------------------------------------------------*/
type ToggleButtonGroupContext = {
  slots?: ReturnType<typeof toggleButtonGroupVariants>;
  size?: ToggleButtonVariants["size"];
  isDisabled?: boolean;
};

const ToggleButtonGroupContext = createContext<ToggleButtonGroupContext>({});

// Property name to mark direct children of ToggleButtonGroup
export const TOGGLE_BUTTON_GROUP_CHILD = "__toggle_button_group_child";

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Root
 * -------------------------------------------------------------------------------------------------
 * The RAC ToggleButtonGroup primitive owns selection, keyboard and ARIA: `selectionMode="single"`
 * renders a radiogroup with radio buttons, `"multiple"` a toolbar with toggle buttons. This Root
 * adds the BEM slots and the orientation the buttons and the separator style by.
 * -----------------------------------------------------------------------------------------------*/
interface ToggleButtonGroupRootProps
  extends ComponentPropsWithRef<typeof ToggleButtonGroupPrimitive>, ToggleButtonGroupVariants {
  /** Size to propagate to all child ToggleButtons */
  size?: ToggleButtonVariants["size"];
  /** Whether the group buttons are visually separated (detached) instead of connected */
  isDetached?: boolean;
}

const ToggleButtonGroupRoot = ({
  children,
  className,
  fullWidth,
  isDetached = false,
  isDisabled,
  orientation: orientationProp,
  size,
  ...rest
}: ToggleButtonGroupRootProps) => {
  // Inherits the orientation when the group itself is nested in another RAC group (e.g. a Toolbar)
  const racContext = useSlottedContext(RACToggleButtonGroupContext);
  const orientation = orientationProp ?? racContext?.orientation ?? "horizontal";

  const slots = React.useMemo(
    () => toggleButtonGroupVariants({fullWidth, isDetached, orientation}),
    [fullWidth, isDetached, orientation],
  );
  const contextValue = React.useMemo(() => ({slots, size, isDisabled}), [slots, size, isDisabled]);

  return (
    <ToggleButtonGroupContext value={contextValue}>
      <ToggleButtonGroupPrimitive
        className={composeTwRenderProps(className, slots.base())}
        isDisabled={isDisabled}
        orientation={orientation}
        {...rest}
        data-slot="toggle-button-group"
      >
        {children}
      </ToggleButtonGroupPrimitive>
    </ToggleButtonGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ToggleButtonGroup Separator
 * -------------------------------------------------------------------------------------------------
 * A visual divider placed inside a ToggleButton (not between them): it positions itself against
 * the button's relative box, and the group's CSS hides it in detached mode.
 * -----------------------------------------------------------------------------------------------*/
interface ToggleButtonGroupSeparatorProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  className?: string;
}

const ToggleButtonGroupSeparator = <E extends keyof React.JSX.IntrinsicElements = "span">({
  className,
  ...props
}: ToggleButtonGroupSeparatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof ToggleButtonGroupSeparatorProps<E>>) => {
  const {slots} = use(ToggleButtonGroupContext);

  return (
    <dom.span
      aria-hidden="true"
      className={composeSlotClassName(slots?.separator, className)}
      /*
       * The permitted `any`: the element type is a type parameter the spread has erased; no
       * expressible annotation exists. references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="toggle-button-group-separator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ToggleButtonGroupRoot, ToggleButtonGroupSeparator, ToggleButtonGroupContext};

export type {ToggleButtonGroupRootProps, ToggleButtonGroupSeparatorProps};

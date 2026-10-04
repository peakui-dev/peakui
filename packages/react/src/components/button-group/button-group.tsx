"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ButtonProps} from "../button/index.ts";
import type {ButtonGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, ReactNode} from "react";

import {buttonGroupVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {useSlottedContext} from "react-aria-components/slots";
import {ToggleButtonGroupContext as RACToggleButtonGroupContext} from "react-aria-components/ToggleButtonGroup";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Context
 * -----------------------------------------------------------------------------------------------*/
type ButtonGroupContextValue = {
  slots?: ReturnType<typeof buttonGroupVariants>;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  isDisabled?: ButtonProps["isDisabled"];
  fullWidth?: ButtonProps["fullWidth"];
};

const ButtonGroupContext = createContext<ButtonGroupContextValue>({});

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface ButtonGroupRootProps
  extends
    ComponentPropsWithRef<typeof GroupPrimitive>,
    Pick<ButtonProps, "size" | "variant">,
    ButtonGroupVariants {
  /** The orientation of the button group */
  orientation?: "horizontal" | "vertical";
}

/*
 * A thin styled composition over the RAC Group primitive: behavior and ARIA are the primitive's,
 * this adds the class names and the context the parts share.
 *
 * `Button` consumes this context and merges `size`, `variant`, `isDisabled` and `fullWidth` with
 * its own props, direct props winning — the plain context-merge pattern of toggle-button.tsx.
 * The divergence recorded in docs/superpowers/specs/2026-10-02-react-package-button-design.md
 * section 12 was resolved on 2026-10-04 (wave-2 ledger). The reference's BUTTON_GROUP_CHILD
 * cloning stays dropped: the marker leaks a stray DOM attribute onto children that do not
 * destructure it out, so the merge is depth-blind instead.
 */
const ButtonGroupRoot = ({
  children,
  className,
  fullWidth,
  isDisabled,
  orientation: orientationProp,
  size,
  variant,
  ...rest
}: ButtonGroupRootProps) => {
  const racContext = useSlottedContext(RACToggleButtonGroupContext);
  const orientation = orientationProp ?? racContext?.orientation ?? "horizontal";

  const slots = useMemo(
    () => buttonGroupVariants({fullWidth, orientation}),
    [fullWidth, orientation],
  );

  const context = useMemo<ButtonGroupContextValue>(
    () => ({slots, size, variant, isDisabled, fullWidth}),
    [slots, size, variant, isDisabled, fullWidth],
  );

  return (
    <ButtonGroupContext value={context}>
      <GroupPrimitive
        className={composeTwRenderProps(className, slots.base())}
        isDisabled={isDisabled}
        {...rest}
        data-slot="button-group"
      >
        {children}
      </GroupPrimitive>
    </ButtonGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ButtonGroup Separator
 * -----------------------------------------------------------------------------------------------*/
interface ButtonGroupSeparatorProps<
  E extends keyof React.JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ButtonGroupSeparator = <E extends keyof React.JSX.IntrinsicElements = "span">({
  className,
  ...props
}: ButtonGroupSeparatorProps<E> &
  Omit<React.JSX.IntrinsicElements[E], keyof ButtonGroupSeparatorProps<E>>) => {
  const {slots} = use(ButtonGroupContext);

  return (
    <dom.span
      aria-hidden="true"
      className={composeSlotClassName(slots?.separator, className)}
      /* The element type is a type parameter the spread has erased; no expressible annotation
       * exists. references/typescript.md, the polymorphic spread boundary. */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      data-slot="button-group-separator"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
/*
 * The context leaves the module beside the components, as in the reference: a consumer building
 * custom group-aware parts reads it. Fast refresh does not apply to a plain context object, and
 * the rule here catches the shape, not a defect — the same disable lives in utils/dom.tsx.
 */
// eslint-disable-next-line react-refresh/only-export-components
export {ButtonGroupRoot, ButtonGroupSeparator, ButtonGroupContext};

export type {ButtonGroupRootProps, ButtonGroupSeparatorProps};

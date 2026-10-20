"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ColorInputGroupVariants} from "@peakui/styles";
import type {ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {InputProps as InputPrimitiveProps} from "react-aria-components/Input";

import {colorInputGroupVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {Group as GroupPrimitive} from "react-aria-components/Group";
import {Input as InputPrimitive} from "react-aria-components/Input";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ColorInputGroup Context
 * -----------------------------------------------------------------------------------------------*/
type ColorInputGroupContext = {
  slots?: ReturnType<typeof colorInputGroupVariants>;
};

const ColorInputGroupContext = createContext<ColorInputGroupContext>({});

/* -------------------------------------------------------------------------------------------------
 * ColorInputGroup Root
 * -----------------------------------------------------------------------------------------------*/
interface ColorInputGroupRootProps
  extends ComponentPropsWithRef<typeof GroupPrimitive>, ColorInputGroupVariants {}

const ColorInputGroupRoot = ({
  children,
  className,
  fullWidth,
  variant,
  ...props
}: ColorInputGroupRootProps) => {
  const slots = useMemo(() => colorInputGroupVariants({fullWidth, variant}), [fullWidth, variant]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <ColorInputGroupContext value={contextValue}>
      <GroupPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="color-input-group"
      >
        {children}
      </GroupPrimitive>
    </ColorInputGroupContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorInputGroup Prefix
 * -----------------------------------------------------------------------------------------------*/
interface ColorInputGroupPrefixProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ColorInputGroupPrefix = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ColorInputGroupPrefixProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ColorInputGroupPrefixProps<E>>) => {
  const {slots} = use(ColorInputGroupContext);

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.prefix, className)}
      data-slot="color-input-group-prefix"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorInputGroup Input
 * -----------------------------------------------------------------------------------------------*/
interface ColorInputGroupInputProps extends InputPrimitiveProps {}

const ColorInputGroupInput = ({className, ...props}: ColorInputGroupInputProps) => {
  const {slots} = use(ColorInputGroupContext);

  return (
    <InputPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.input())}
      data-slot="color-input-group-input"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorInputGroup Suffix
 * -----------------------------------------------------------------------------------------------*/
interface ColorInputGroupSuffixProps<
  E extends keyof JSX.IntrinsicElements = "div",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode;
  className?: string;
}

const ColorInputGroupSuffix = <E extends keyof JSX.IntrinsicElements = "div">({
  children,
  className,
  ...props
}: ColorInputGroupSuffixProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ColorInputGroupSuffixProps<E>>) => {
  const {slots} = use(ColorInputGroupContext);

  return (
    <dom.div
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.suffix, className)}
      data-slot="color-input-group-suffix"
    >
      {children}
    </dom.div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ColorInputGroupRoot, ColorInputGroupInput, ColorInputGroupPrefix, ColorInputGroupSuffix};

export type {
  ColorInputGroupRootProps,
  ColorInputGroupInputProps,
  ColorInputGroupPrefixProps,
  ColorInputGroupSuffixProps,
};

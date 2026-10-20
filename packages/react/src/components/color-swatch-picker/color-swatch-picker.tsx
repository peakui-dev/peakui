"use client";

import type {DOMRenderProps} from "../../utils/dom.tsx";
import type {ColorSwatchPickerVariants} from "@peakui/styles";
import type {CSSProperties, ComponentPropsWithRef, JSX, ReactNode} from "react";
import type {ColorSwatchPickerItemRenderProps} from "react-aria-components/ColorSwatchPicker";

import {colorSwatchPickerVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {
  ColorSwatchPickerItem as ColorSwatchPickerItemPrimitive,
  ColorSwatchPicker as ColorSwatchPickerPrimitive,
  ColorSwatch as ColorSwatchPrimitive,
} from "react-aria-components/ColorSwatchPicker";

import {composeSlotClassName, composeTwRenderProps} from "../../utils/compose.ts";
import {dom} from "../../utils/dom.tsx";

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPicker Context
 * -----------------------------------------------------------------------------------------------*/
type ColorSwatchPickerContext = {
  slots?: ReturnType<typeof colorSwatchPickerVariants>;
};

const ColorSwatchPickerContext = createContext<ColorSwatchPickerContext>({});

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPickerItem Context
 * -----------------------------------------------------------------------------------------------*/
type ColorSwatchPickerItemContext = {
  state?: ColorSwatchPickerItemRenderProps;
};

const ColorSwatchPickerItemContext = createContext<ColorSwatchPickerItemContext>({});

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPicker Root
 * -----------------------------------------------------------------------------------------------*/
interface ColorSwatchPickerRootProps
  extends ComponentPropsWithRef<typeof ColorSwatchPickerPrimitive>, ColorSwatchPickerVariants {}

const ColorSwatchPickerRoot = ({
  children,
  className,
  layout,
  size,
  variant,
  ...props
}: ColorSwatchPickerRootProps) => {
  const slots = useMemo(
    () => colorSwatchPickerVariants({layout, size, variant}),
    [layout, size, variant],
  );
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <ColorSwatchPickerContext value={contextValue}>
      <ColorSwatchPickerPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="color-swatch-picker"
      >
        {children}
      </ColorSwatchPickerPrimitive>
    </ColorSwatchPickerContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPicker Item
 * -----------------------------------------------------------------------------------------------*/
interface ColorSwatchPickerItemProps extends ComponentPropsWithRef<
  typeof ColorSwatchPickerItemPrimitive
> {}

const ColorSwatchPickerItem = ({
  children,
  className,
  style,
  ...props
}: ColorSwatchPickerItemProps) => {
  const {slots} = use(ColorSwatchPickerContext);

  return (
    <ColorSwatchPickerItemPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.item())}
      data-slot="color-swatch-picker-item"
      style={(renderProps) => {
        const userStyle = typeof style === "function" ? style(renderProps) : style;

        return {
          "--color-swatch-current": renderProps.color.toString("css"),
          ...userStyle,
        } as CSSProperties;
      }}
    >
      {(renderProps) => (
        <ColorSwatchPickerItemContext value={{state: renderProps}}>
          {typeof children === "function" ? children(renderProps) : children}
        </ColorSwatchPickerItemContext>
      )}
    </ColorSwatchPickerItemPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPicker Swatch
 * -----------------------------------------------------------------------------------------------*/
interface ColorSwatchPickerSwatchProps extends ComponentPropsWithRef<typeof ColorSwatchPrimitive> {}

const ColorSwatchPickerSwatch = ({className, ...props}: ColorSwatchPickerSwatchProps) => {
  const {slots} = use(ColorSwatchPickerContext);

  return (
    <ColorSwatchPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.swatch())}
      data-slot="color-swatch-picker-swatch"
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSwatchPicker Indicator
 * -----------------------------------------------------------------------------------------------*/
interface ColorSwatchPickerIndicatorProps<
  E extends keyof JSX.IntrinsicElements = "span",
> extends DOMRenderProps<E, undefined> {
  children?: ReactNode | ((props: ColorSwatchPickerItemRenderProps) => ReactNode);
  className?: string;
}

/** Relative luminance of a colour, 0 (black) to 1 (white): L = 0.2126 R + 0.7152 G + 0.0722 B. */
function getColorLuminance(color: ColorSwatchPickerItemRenderProps["color"]): number {
  const r = color.getChannelValue("red");
  const g = color.getChannelValue("green");
  const b = color.getChannelValue("blue");

  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

const ColorSwatchPickerIndicator = <E extends keyof JSX.IntrinsicElements = "span">({
  children,
  className,
  ...props
}: ColorSwatchPickerIndicatorProps<E> &
  Omit<JSX.IntrinsicElements[E], keyof ColorSwatchPickerIndicatorProps<E>>) => {
  const {slots} = use(ColorSwatchPickerContext);
  const {state} = use(ColorSwatchPickerItemContext);

  /* A light colour takes a black check, a dark one a white check. */
  const isLightColor = state?.color ? getColorLuminance(state.color) > 0.5 : false;

  const content =
    typeof children === "function" ? (
      state ? (
        children(state)
      ) : null
    ) : children ? (
      children
    ) : (
      <svg
        aria-hidden="true"
        data-slot="color-swatch-picker-checkmark"
        fill="none"
        role="presentation"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        viewBox="0 0 12 12"
      >
        <polyline points="2.5 6 5 8.5 9.5 3" />
      </svg>
    );

  return (
    <dom.span
      aria-hidden="true"
      /*
       * The permitted `any`: the element type is a parameter, and the spread has erased it.
       * references/typescript.md, the polymorphic spread boundary.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...(props as any)}
      className={composeSlotClassName(slots?.indicator, className)}
      data-light-color={isLightColor ? "true" : undefined}
      data-slot="color-swatch-picker-indicator"
    >
      {content}
    </dom.span>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {
  ColorSwatchPickerIndicator,
  ColorSwatchPickerItem,
  ColorSwatchPickerRoot,
  ColorSwatchPickerSwatch,
};

export type {
  ColorSwatchPickerIndicatorProps,
  ColorSwatchPickerItemProps,
  ColorSwatchPickerRootProps,
  ColorSwatchPickerSwatchProps,
};

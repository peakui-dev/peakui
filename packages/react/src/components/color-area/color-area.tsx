"use client";

import type {ColorAreaVariants} from "@peakui/styles";
import type {CSSProperties, ComponentPropsWithRef} from "react";

import {colorAreaVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {
  ColorArea as ColorAreaPrimitive,
  ColorThumb as ColorThumbPrimitive,
} from "react-aria-components/ColorArea";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * ColorArea Context
 * -----------------------------------------------------------------------------------------------*/
type ColorAreaContext = {
  slots?: ReturnType<typeof colorAreaVariants>;
};

const ColorAreaContext = createContext<ColorAreaContext>({});

/* -------------------------------------------------------------------------------------------------
 * ColorArea Root
 * -----------------------------------------------------------------------------------------------*/
interface ColorAreaRootProps
  extends ComponentPropsWithRef<typeof ColorAreaPrimitive>, ColorAreaVariants {}

const ColorAreaRoot = ({children, className, showDots, style, ...props}: ColorAreaRootProps) => {
  const slots = useMemo(() => colorAreaVariants({showDots}), [showDots]);
  const contextValue = useMemo(() => ({slots}), [slots]);

  return (
    <ColorAreaContext value={contextValue}>
      <ColorAreaPrimitive
        {...props}
        className={composeTwRenderProps(className, slots.base())}
        data-slot="color-area"
        style={(renderProps) => {
          const userStyle = typeof style === "function" ? style(renderProps) : style;

          return {
            "--color-area-background": renderProps.defaultStyle.background,
            ...userStyle,
          } as CSSProperties;
        }}
      >
        {children}
      </ColorAreaPrimitive>
    </ColorAreaContext>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorArea Thumb
 * -----------------------------------------------------------------------------------------------*/
interface ColorAreaThumbProps extends ComponentPropsWithRef<typeof ColorThumbPrimitive> {}

const ColorAreaThumb = ({className, style, ...props}: ColorAreaThumbProps) => {
  const {slots} = use(ColorAreaContext);

  return (
    <ColorThumbPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.thumb())}
      data-slot="color-area-thumb"
      style={(renderProps) => {
        const userStyle = typeof style === "function" ? style(renderProps) : style;

        return {
          "--color-area-thumb-color": renderProps.defaultStyle.backgroundColor,
          ...userStyle,
        } as CSSProperties;
      }}
    />
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ColorAreaRoot, ColorAreaThumb};

export type {ColorAreaRootProps, ColorAreaThumbProps};

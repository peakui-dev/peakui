"use client";

import type {ColorSliderVariants} from "@peakui/styles";
import type {ComponentPropsWithRef} from "react";
import type {ColorSliderRenderProps, ColorSpace} from "react-aria-components/ColorSlider";

import {colorSliderVariants} from "@peakui/styles";
import {createContext, use, useMemo} from "react";
import {
  ColorSlider as ColorSliderPrimitive,
  ColorThumb as ColorThumbPrimitive,
  SliderOutput as SliderOutputPrimitive,
  SliderTrack as SliderTrackPrimitive,
} from "react-aria-components/ColorSlider";

import {composeTwRenderProps} from "../../utils/compose.ts";

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Channel Types
 * -----------------------------------------------------------------------------------------------*/

/** Channels available in the HSL colour space. */
type HSLChannel = "hue" | "saturation" | "lightness" | "alpha";

/** Channels available in the HSB colour space. */
type HSBChannel = "hue" | "saturation" | "brightness" | "alpha";

/** Channels available in the RGB colour space. */
type RGBChannel = "red" | "green" | "blue" | "alpha";

/** Channels shared between HSL and HSB, but not RGB. */
type HSLHSBSharedChannel = "hue" | "saturation";

/** The alpha channel works in every colour space. */
type AlphaChannel = "alpha";

/**
 * Valid channel and colour-space pairs. TypeScript rejects an invalid pair such as
 * `channel="red"` with `colorSpace="hsl"`, or `channel="saturation"` with `colorSpace="rgb"`.
 */
type ColorSliderChannelProps =
  | {channel: HSLChannel; colorSpace?: "hsl"}
  | {channel: HSBChannel; colorSpace?: "hsb"}
  | {channel: RGBChannel; colorSpace?: "rgb"}
  | {channel: HSLHSBSharedChannel; colorSpace?: "hsl" | "hsb"}
  | {channel: AlphaChannel; colorSpace?: ColorSpace};

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Validation Utilities
 * -----------------------------------------------------------------------------------------------*/

/** Channels that exist in one colour space only. */
const CHANNEL_TO_REQUIRED_COLORSPACE: Partial<Record<string, ColorSpace>> = {
  blue: "rgb",
  brightness: "hsb",
  green: "rgb",
  lightness: "hsl",
  red: "rgb",
};

/** Channels that exist in HSL and HSB but not in RGB. */
const HSL_HSB_ONLY_CHANNELS = new Set(["hue", "saturation"]);

/*
 * getValidColorSpace runs in the render body, so an unguarded warning would fire on every render
 * of a misconfigured slider in production builds.
 */
function warnInDev(message: string) {
  if (typeof process !== "undefined" && process.env?.["NODE_ENV"] !== "production") {
    // eslint-disable-next-line no-console
    console.warn(message);
  }
}

/** Returns a colour space the channel exists in, warning in development when it had to correct one. */
function getValidColorSpace(channel: string, colorSpace?: ColorSpace): ColorSpace | undefined {
  const requiredSpace = CHANNEL_TO_REQUIRED_COLORSPACE[channel];

  if (requiredSpace && colorSpace && colorSpace !== requiredSpace) {
    warnInDev(
      `[PeakUI ColorSlider] Invalid combination: channel="${channel}" requires colorSpace="${requiredSpace}", ` +
        `but received colorSpace="${colorSpace}". Auto-correcting to "${requiredSpace}".`,
    );

    return requiredSpace;
  }

  if (HSL_HSB_ONLY_CHANNELS.has(channel) && colorSpace === "rgb") {
    warnInDev(
      `[PeakUI ColorSlider] Invalid combination: channel="${channel}" is not available in the RGB color space. ` +
        `Use colorSpace="hsl" or colorSpace="hsb" instead. Auto-correcting to "hsl".`,
    );

    return "hsl";
  }

  return colorSpace;
}

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Context
 * -----------------------------------------------------------------------------------------------*/
type ColorSliderContext = {
  channel?: string;
  slots?: ReturnType<typeof colorSliderVariants>;
  state?: ColorSliderRenderProps;
};

const ColorSliderContext = createContext<ColorSliderContext>({});

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Root
 * -----------------------------------------------------------------------------------------------*/
interface ColorSliderRootBaseProps
  extends
    Omit<ComponentPropsWithRef<typeof ColorSliderPrimitive>, "channel" | "colorSpace">,
    ColorSliderVariants {}

type ColorSliderRootProps = ColorSliderRootBaseProps & ColorSliderChannelProps;

const ColorSliderRoot = ({
  channel,
  children,
  className,
  colorSpace,
  orientation = "horizontal",
  ...props
}: ColorSliderRootProps) => {
  const slots = useMemo(() => colorSliderVariants(), []);
  const validColorSpace = getValidColorSpace(channel, colorSpace);

  return (
    <ColorSliderPrimitive
      {...props}
      channel={channel}
      className={composeTwRenderProps(className, slots.base())}
      colorSpace={validColorSpace}
      data-slot="color-slider"
      orientation={orientation}
    >
      {(values) => (
        <ColorSliderContext value={{channel, slots, state: values}}>
          {typeof children === "function" ? children(values) : children}
        </ColorSliderContext>
      )}
    </ColorSliderPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Output
 * -----------------------------------------------------------------------------------------------*/
interface ColorSliderOutputProps extends ComponentPropsWithRef<typeof SliderOutputPrimitive> {}

const ColorSliderOutput = ({children, className, ...props}: ColorSliderOutputProps) => {
  const {slots} = use(ColorSliderContext);

  return (
    <SliderOutputPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.output())}
      data-slot="color-slider-output"
    >
      {children
        ? (values) => <>{typeof children === "function" ? children(values) : children}</>
        : ({state}) => state.getThumbValueLabel(0)}
    </SliderOutputPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Track
 * -----------------------------------------------------------------------------------------------*/
interface ColorSliderTrackProps extends ComponentPropsWithRef<typeof SliderTrackPrimitive> {}

const ColorSliderTrack = ({children, className, style, ...props}: ColorSliderTrackProps) => {
  const {channel, slots, state} = use(ColorSliderContext);
  const displayColor = state?.state?.getDisplayColor();

  /* The colours at both ends of the channel paint the edge caps past the track. */
  const edgeColors = useMemo(() => {
    if (!displayColor || !channel) {
      return {end: "transparent", start: "transparent"};
    }

    const range = displayColor.getChannelRange(
      channel as Parameters<typeof displayColor.getChannelRange>[0],
    );
    const startColor = displayColor.withChannelValue(
      channel as Parameters<typeof displayColor.withChannelValue>[0],
      range.minValue,
    );
    const endColor = displayColor.withChannelValue(
      channel as Parameters<typeof displayColor.withChannelValue>[0],
      range.maxValue,
    );

    return {end: endColor.toString("css"), start: startColor.toString("css")};
  }, [channel, displayColor]);

  return (
    <SliderTrackPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.track())}
      data-slot="color-slider-track"
      style={({defaultStyle, ...rest}) => ({
        /* The checkerboard under the gradient shows a translucent colour (the alpha channel). */
        background: `${defaultStyle.background}, var(--color-slider-checker)`,
        "--track-end-color": edgeColors.end,
        "--track-start-color": edgeColors.start,
        ...(typeof style === "function" ? style({defaultStyle, ...rest}) : style),
      })}
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </SliderTrackPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * ColorSlider Thumb
 * -----------------------------------------------------------------------------------------------*/
interface ColorSliderThumbProps extends ComponentPropsWithRef<typeof ColorThumbPrimitive> {}

const ColorSliderThumb = ({children, className, style, ...props}: ColorSliderThumbProps) => {
  const {slots} = use(ColorSliderContext);

  return (
    <ColorThumbPrimitive
      {...props}
      className={composeTwRenderProps(className, slots?.thumb())}
      data-slot="color-slider-thumb"
      style={({defaultStyle, isDisabled, ...rest}) => ({
        ...defaultStyle,
        backgroundColor: isDisabled ? undefined : defaultStyle.backgroundColor,
        ...(typeof style === "function" ? style({defaultStyle, isDisabled, ...rest}) : style),
      })}
    >
      {(values) => <>{typeof children === "function" ? children(values) : children}</>}
    </ColorThumbPrimitive>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Exports
 * -----------------------------------------------------------------------------------------------*/
export {ColorSliderOutput, ColorSliderRoot, ColorSliderThumb, ColorSliderTrack};

export type {
  AlphaChannel,
  ColorSliderChannelProps,
  ColorSliderOutputProps,
  ColorSliderRootProps,
  ColorSliderThumbProps,
  ColorSliderTrackProps,
  HSBChannel,
  HSLChannel,
  HSLHSBSharedChannel,
  RGBChannel,
};

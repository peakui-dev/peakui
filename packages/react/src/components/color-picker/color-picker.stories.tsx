import type {Meta, StoryObj} from "@storybook/react-vite";
import type {ReactNode} from "react";

import React from "react";
import {ColorSlider, ColorThumb, SliderTrack, parseColor} from "react-aria-components/ColorSlider";
import {ColorSwatchPicker, ColorSwatchPickerItem} from "react-aria-components/ColorSwatchPicker";

import {Button} from "../button/index.ts";
import {ColorSwatch} from "../color-swatch/index.ts";
import {Label} from "../label/index.ts";

import {ColorPicker} from "./index.ts";

/*
 * Every story carries a level-two heading: the audit in apps/storybook/e2e waits for it as the
 * sign that the preview is ready, and without it axe runs against an empty iframe and passes.
 */
const Showcase = ({children, title}: {children: ReactNode; title: string}) => (
  <div className="flex flex-col gap-4 bg-background p-6">
    <h2 className="text-sm font-medium text-foreground">{title}</h2>
    {children}
  </div>
);

/*
 * Editor stand-ins: the editing parts (ColorArea, ColorSlider, ColorField, ColorSwatchPicker in
 * peakui's own styling) are roadmap wave 3.5 and not in this order, so the stories compose
 * RAC's editors directly — the consumer's prerogative this container is built for — with
 * story-local presentation classes. RAC's ColorSlider renders a provider div only, so the track
 * and the thumb carry the visuals here.
 */
const HueEditor = () => (
  <ColorSlider aria-label="Hue" channel="hue" className="w-56 px-1" colorSpace="hsb">
    <SliderTrack
      className="relative h-2 overflow-hidden rounded-full"
      style={{
        background: "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
      }}
    >
      <ColorThumb className="size-4 rounded-full border-2 border-white shadow" />
    </SliderTrack>
  </ColorSlider>
);

const colorPresets = [
  "#ef4444", // red-500
  "#f97316", // orange-500
  "#eab308", // yellow-500
  "#22c55e", // green-500
  "#06b6d4", // cyan-500
  "#3b82f6", // blue-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#f43f5e", // rose-500
];

/*
 * Story-local glyph, inlined verbatim from @gravity-ui/icons (MIT) — the same source the
 * internal icons module keeps; see THIRD-PARTY-NOTICES.md.
 */
const ShuffleIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      clipRule="evenodd"
      d="M1.75 12.5a.75.75 0 0 1 0-1.5h2.044c.86 0 1.644-.49 2.021-1.262L6.665 8l-.85-1.738A2.25 2.25 0 0 0 3.794 5H1.75a.75.75 0 1 1 0-1.5h2.044a3.75 3.75 0 0 1 3.369 2.103l.337.69.337-.69A3.75 3.75 0 0 1 11.206 3.5h1.233l-.97-.97a.75.75 0 0 1 1.061-1.06l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97h-1.234c-.86 0-1.644.49-2.021 1.262l-2.022 4.135A3.75 3.75 0 0 1 3.794 12.5zm6.639-1.542.696-1.424.1.204A2.25 2.25 0 0 0 11.206 11h1.233l-.97-.97a.75.75 0 1 1 1.061-1.06l2.25 2.25a.75.75 0 0 1 0 1.06l-2.25 2.25a.75.75 0 1 1-1.06-1.06l.97-.97h-1.234a3.75 3.75 0 0 1-2.905-1.378q.046-.08.088-.164"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

const meta = {
  component: ColorPicker,
  parameters: {
    layout: "centered",
  },
  title: "Components/Colors/ColorPicker",
} satisfies Meta<typeof ColorPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Showcase title="Default">
      <ColorPicker defaultValue="#0485F7">
        <ColorPicker.Trigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPicker.Trigger>
        <ColorPicker.Popover>
          <HueEditor />
        </ColorPicker.Popover>
      </ColorPicker>
    </Showcase>
  ),
};

export const Controlled: Story = {
  render: function ControlledColorPicker() {
    const [color, setColor] = React.useState(parseColor("#325578"));

    const shuffleColor = () => {
      const randomHue = Math.floor(Math.random() * 360);
      const randomSaturation = 50 + Math.floor(Math.random() * 50); // 50-100%
      const randomLightness = 40 + Math.floor(Math.random() * 30); // 40-70%

      setColor(parseColor(`hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`));
    };

    return (
      <Showcase title="Controlled">
        <ColorPicker value={color} onChange={setColor}>
          <ColorPicker.Trigger>
            <ColorSwatch size="lg" />
            <Label>Pick a color</Label>
          </ColorPicker.Trigger>
          <ColorPicker.Popover className="gap-2">
            <ColorSwatchPicker
              aria-label="Color presets"
              className="grid grid-cols-9 justify-center gap-1 pt-2"
            >
              {colorPresets.map((preset) => (
                <ColorSwatchPickerItem
                  key={preset}
                  className="flex size-6 items-center justify-center"
                  color={preset}
                >
                  <ColorSwatch />
                </ColorSwatchPickerItem>
              ))}
            </ColorSwatchPicker>
            <HueEditor />
            <Button isIconOnly aria-label="Shuffle color" size="sm" onPress={shuffleColor}>
              <ShuffleIcon className="size-4" />
            </Button>
          </ColorPicker.Popover>
        </ColorPicker>
        <p className="w-60 text-sm text-muted">
          Selected: <span className="font-medium">{color.toString("hex")}</span>
        </p>
      </Showcase>
    );
  },
};

export const WithSwatches: Story = {
  render: () => {
    return (
      <Showcase title="WithSwatches">
        <ColorPicker defaultValue="#F43F5E">
          <ColorPicker.Trigger>
            <ColorSwatch size="lg" />
            <Label>Brand Color</Label>
          </ColorPicker.Trigger>
          <ColorPicker.Popover>
            <ColorSwatchPicker
              aria-label="Color presets"
              className="grid grid-cols-9 justify-center gap-1 px-1"
            >
              {colorPresets.map((preset) => (
                <ColorSwatchPickerItem
                  key={preset}
                  className="flex size-6 items-center justify-center"
                  color={preset}
                >
                  <ColorSwatch />
                </ColorSwatchPickerItem>
              ))}
            </ColorSwatchPicker>
            <HueEditor />
          </ColorPicker.Popover>
        </ColorPicker>
      </Showcase>
    );
  },
};

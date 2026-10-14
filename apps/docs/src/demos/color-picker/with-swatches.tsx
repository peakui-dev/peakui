import {ColorPicker, ColorSwatch, Label} from "@peakui/react";
import {ColorSlider, ColorThumb, SliderTrack} from "react-aria-components/ColorSlider";
import {ColorSwatchPicker, ColorSwatchPickerItem} from "react-aria-components/ColorSwatchPicker";

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

export function WithSwatches() {
  return (
    <ColorPicker defaultValue="#F43F5E">
      <ColorPicker.Trigger>
        <ColorSwatch size="lg" />
        <Label>Brand Color</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover>
        {/* Editor stand-in, as in the basic demo: RAC editors until wave 3.5 lands. */}
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
        <ColorSlider aria-label="Hue" channel="hue" className="px-1" colorSpace="hsb">
          <SliderTrack
            className="relative h-2 overflow-hidden rounded-full"
            style={{
              background: "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
            }}
          >
            <ColorThumb className="size-4 rounded-full border-2 border-white shadow" />
          </SliderTrack>
        </ColorSlider>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

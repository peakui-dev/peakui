"use client";

import {
  ColorArea,
  ColorField,
  ColorInputGroup,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
} from "@peakui/react";

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
      <ColorPicker.Popover className="flex w-64 flex-col gap-3">
        <ColorSwatchPicker aria-label="Color presets" size="xs">
          {colorPresets.map((preset) => (
            <ColorSwatchPicker.Item key={preset} color={preset}>
              <ColorSwatchPicker.Swatch />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
        <ColorArea
          aria-label="Saturation and brightness"
          className="max-w-none"
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
        >
          <ColorArea.Thumb />
        </ColorArea>
        <ColorSlider channel="hue" colorSpace="hsb">
          <Label>Hue</Label>
          <ColorSlider.Output />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
        <ColorField aria-label="Hex">
          <ColorInputGroup variant="secondary">
            <ColorInputGroup.Prefix>
              <ColorSwatch aria-label="Current color" size="xs" />
            </ColorInputGroup.Prefix>
            <ColorInputGroup.Input />
          </ColorInputGroup>
        </ColorField>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

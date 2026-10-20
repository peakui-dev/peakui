"use client";

import {ColorPicker, ColorSlider, ColorSwatch, Label} from "@peakui/react";

export function CustomStyles() {
  return (
    <ColorPicker defaultValue="#0485F7">
      <ColorPicker.Trigger className="rounded-xl bg-default-soft px-3 py-2">
        <ColorSwatch size="lg" />
        <Label className="font-medium text-foreground">Theme color</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="bg-surface">
        <ColorSlider channel="hue" className="w-56" colorSpace="hsb">
          <Label>Hue</Label>
          <ColorSlider.Output />
          <ColorSlider.Track>
            <ColorSlider.Thumb />
          </ColorSlider.Track>
        </ColorSlider>
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

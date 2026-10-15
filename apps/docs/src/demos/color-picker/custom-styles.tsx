"use client";

/* Client module: composes react-aria-components' editor directly, as the basic demo does. */
import {ColorPicker, ColorSwatch, Label} from "@peakui/react";
import {ColorSlider, ColorThumb, SliderTrack} from "react-aria-components/ColorSlider";

export function CustomStyles() {
  return (
    <ColorPicker defaultValue="#0485F7">
      <ColorPicker.Trigger className="rounded-xl bg-default-soft px-3 py-2">
        <ColorSwatch size="lg" />
        <Label className="font-medium text-foreground">Theme color</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover className="bg-surface">
        {/* Editor stand-in, as in the basic demo: RAC editors until wave 3.5 lands. */}
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
      </ColorPicker.Popover>
    </ColorPicker>
  );
}

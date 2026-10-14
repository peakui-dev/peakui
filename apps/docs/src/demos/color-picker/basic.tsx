import {ColorPicker, ColorSwatch, Label} from "@peakui/react";
import {ColorSlider, ColorThumb, SliderTrack} from "react-aria-components/ColorSlider";

/*
 * Editor stand-in: the editing parts (ColorArea, ColorSlider, ColorField, ColorSwatchPicker in
 * peakui's own styling) are roadmap wave 3.5, so this demo composes RAC's hue slider directly —
 * the consumer's prerogative this container is built for.
 */
export function Basic() {
  return (
    <ColorPicker defaultValue="#0485F7">
      <ColorPicker.Trigger>
        <ColorSwatch size="lg" />
        <Label>Pick a color</Label>
      </ColorPicker.Trigger>
      <ColorPicker.Popover>
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

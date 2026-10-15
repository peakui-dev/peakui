"use client";

import {Shuffle as ShuffleIcon} from "@gravity-ui/icons";
import {Button, ColorPicker, ColorSwatch, Label} from "@peakui/react";
import {useState} from "react";
import {ColorSlider, ColorThumb, SliderTrack, parseColor} from "react-aria-components/ColorSlider";
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

export function Controlled() {
  const [color, setColor] = useState(parseColor("#325578"));

  const shuffleColor = () => {
    const randomHue = Math.floor(Math.random() * 360);
    const randomSaturation = 50 + Math.floor(Math.random() * 50); // 50-100%
    const randomLightness = 40 + Math.floor(Math.random() * 30); // 40-70%

    setColor(parseColor(`hsl(${randomHue}, ${randomSaturation}%, ${randomLightness}%)`));
  };

  return (
    <div className="flex flex-col gap-4">
      <ColorPicker value={color} onChange={setColor}>
        <ColorPicker.Trigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPicker.Trigger>
        <ColorPicker.Popover className="gap-2">
          {/* Editor stand-in, as in the basic demo: RAC editors until wave 3.5 lands. */}
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
          <div className="flex items-center gap-2 px-1">
            <ColorSlider aria-label="Hue" channel="hue" className="flex-1" colorSpace="hsb">
              <SliderTrack
                className="relative h-2 overflow-hidden rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
                }}
              >
                <ColorThumb className="size-4 rounded-full border-2 border-white shadow" />
              </SliderTrack>
            </ColorSlider>
            <Button
              isIconOnly
              aria-label="Shuffle color"
              size="sm"
              variant="tertiary"
              onPress={shuffleColor}
            >
              <ShuffleIcon className="size-4" />
            </Button>
          </div>
        </ColorPicker.Popover>
      </ColorPicker>
      <p className="w-60 text-sm text-muted">
        Selected: <span className="font-medium">{color.toString("hex")}</span>
      </p>
    </div>
  );
}

"use client";

import {Shuffle as ShuffleIcon} from "@gravity-ui/icons";
import {
  Button,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  Label,
} from "@peakui/react";
import {useState} from "react";

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
  const [color, setColor] = useState("#325578");

  const shuffleColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 50 + Math.floor(Math.random() * 50); // 50-100%
    const lightness = 40 + Math.floor(Math.random() * 30); // 40-70%

    setColor(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  };

  return (
    <div className="flex flex-col gap-4">
      <ColorPicker value={color} onChange={(next) => setColor(next.toString("hex"))}>
        <ColorPicker.Trigger>
          <ColorSwatch size="lg" />
          <Label>Pick a color</Label>
        </ColorPicker.Trigger>
        <ColorPicker.Popover className="flex w-64 flex-col gap-3">
          <ColorSwatchPicker aria-label="Color presets" size="xs">
            {colorPresets.map((preset) => (
              <ColorSwatchPicker.Item key={preset} color={preset}>
                <ColorSwatchPicker.Swatch />
              </ColorSwatchPicker.Item>
            ))}
          </ColorSwatchPicker>
          <div className="flex items-end gap-2">
            <ColorSlider channel="hue" className="flex-1" colorSpace="hsb">
              <Label>Hue</Label>
              <ColorSlider.Output />
              <ColorSlider.Track>
                <ColorSlider.Thumb />
              </ColorSlider.Track>
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
        Selected: <span className="font-medium">{color}</span>
      </p>
    </div>
  );
}

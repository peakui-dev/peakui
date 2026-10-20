import {ColorSwatchPicker} from "@peakui/react";

const COLORS = ["#EF4444", "#F59E0B", "#10B981", "#0485F7", "#D946EF"];

export function Basic() {
  return (
    <ColorSwatchPicker aria-label="Palette" defaultValue={COLORS[0]}>
      {COLORS.map((color) => (
        <ColorSwatchPicker.Item key={color} color={color}>
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator />
        </ColorSwatchPicker.Item>
      ))}
    </ColorSwatchPicker>
  );
}

import {ColorSwatchPicker} from "@peakui/react";

const COLORS = ["#EF4444", "#10B981", "#0485F7"];

export function Stack() {
  return (
    <ColorSwatchPicker aria-label="Palette" defaultValue={COLORS[0]} layout="stack">
      {COLORS.map((color) => (
        <ColorSwatchPicker.Item key={color} color={color}>
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator />
        </ColorSwatchPicker.Item>
      ))}
    </ColorSwatchPicker>
  );
}

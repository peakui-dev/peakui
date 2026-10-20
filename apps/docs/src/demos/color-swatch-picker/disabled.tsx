import {ColorSwatchPicker} from "@peakui/react";

const COLORS = ["#EF4444", "#10B981", "#0485F7"];

export function Disabled() {
  return (
    <ColorSwatchPicker aria-label="Palette" defaultValue={COLORS[0]}>
      {COLORS.map((color) => (
        <ColorSwatchPicker.Item key={color} isDisabled color={color}>
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator />
        </ColorSwatchPicker.Item>
      ))}
    </ColorSwatchPicker>
  );
}

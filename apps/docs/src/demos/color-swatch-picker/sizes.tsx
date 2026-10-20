import {ColorSwatchPicker} from "@peakui/react";

const COLORS = ["#EF4444", "#10B981", "#0485F7"];

export function Sizes() {
  return (
    <div className="flex flex-col gap-3">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <ColorSwatchPicker
          key={size}
          aria-label={`Palette ${size}`}
          defaultValue={COLORS[0]}
          size={size}
        >
          {COLORS.map((color) => (
            <ColorSwatchPicker.Item key={color} color={color}>
              <ColorSwatchPicker.Swatch />
              <ColorSwatchPicker.Indicator />
            </ColorSwatchPicker.Item>
          ))}
        </ColorSwatchPicker>
      ))}
    </div>
  );
}

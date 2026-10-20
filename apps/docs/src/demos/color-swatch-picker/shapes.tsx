import {ColorSwatchPicker} from "@peakui/react";

const COLORS = ["#EF4444", "#10B981", "#0485F7"];

export function Shapes() {
  return (
    <div className="flex flex-col gap-3">
      {(["circle", "square"] as const).map((variant) => (
        <ColorSwatchPicker
          key={variant}
          aria-label={`Palette ${variant}`}
          defaultValue={COLORS[0]}
          variant={variant}
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

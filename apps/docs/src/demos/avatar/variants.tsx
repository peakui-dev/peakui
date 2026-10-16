import {Avatar} from "@peakui/react";

const COLORS = ["default", "accent", "success", "warning", "danger"] as const;

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      {(["default", "soft"] as const).map((variant) => (
        <div key={variant} className="flex items-center gap-4">
          {COLORS.map((color) => (
            <Avatar key={color} color={color} variant={variant}>
              <Avatar.Fallback>{color.slice(0, 2).toUpperCase()}</Avatar.Fallback>
            </Avatar>
          ))}
        </div>
      ))}
    </div>
  );
}

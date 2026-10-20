import {Avatar, Badge} from "@peakui/react";

const COLORS = ["default", "accent", "success", "warning", "danger"] as const;
const VARIANTS = ["primary", "secondary", "soft"] as const;

export function Variants() {
  return (
    <div className="flex flex-col gap-6">
      {VARIANTS.map((variant) => (
        <div key={variant} className="flex items-center gap-8">
          <span className="w-20 text-sm text-muted capitalize">{variant}</span>
          {COLORS.map((color) => (
            <Badge.Anchor key={color}>
              <Avatar>
                <Avatar.Fallback>JD</Avatar.Fallback>
              </Avatar>
              <Badge color={color} variant={variant}>
                3
              </Badge>
            </Badge.Anchor>
          ))}
        </div>
      ))}
    </div>
  );
}

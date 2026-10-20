import {Avatar, Badge} from "@peakui/react";

const COLORS = ["default", "accent", "success", "warning", "danger"] as const;

export function Colors() {
  return (
    <div className="flex items-center gap-8">
      {COLORS.map((color) => (
        <Badge.Anchor key={color}>
          <Avatar>
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
          <Badge color={color}>3</Badge>
        </Badge.Anchor>
      ))}
    </div>
  );
}

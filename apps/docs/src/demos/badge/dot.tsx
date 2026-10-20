import {Avatar, Badge} from "@peakui/react";

const COLORS = ["accent", "success", "warning", "danger"] as const;

export function Dot() {
  return (
    <div className="flex items-center gap-8">
      {COLORS.map((color) => (
        <Badge.Anchor key={color}>
          <Avatar>
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
          <Badge color={color} placement="bottom-right" size="sm" />
        </Badge.Anchor>
      ))}
    </div>
  );
}

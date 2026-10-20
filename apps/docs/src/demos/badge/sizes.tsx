import {Avatar, Badge} from "@peakui/react";

const SIZES = ["sm", "md", "lg"] as const;

export function Sizes() {
  return (
    <div className="flex items-end gap-8">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-3">
          <Badge.Anchor>
            <Avatar size={size}>
              <Avatar.Fallback>JD</Avatar.Fallback>
            </Avatar>
            <Badge color="danger" size={size}>
              99+
            </Badge>
          </Badge.Anchor>
          <span className="text-xs text-muted">{size}</span>
        </div>
      ))}
    </div>
  );
}

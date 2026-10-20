import {Avatar, Badge} from "@peakui/react";

const PLACEMENTS = ["top-right", "top-left", "bottom-right", "bottom-left"] as const;

export function Placements() {
  return (
    <div className="flex items-center gap-8">
      {PLACEMENTS.map((placement) => (
        <div key={placement} className="flex flex-col items-center gap-3">
          <Badge.Anchor>
            <Avatar>
              <Avatar.Fallback>JD</Avatar.Fallback>
            </Avatar>
            <Badge color="accent" placement={placement}>
              1
            </Badge>
          </Badge.Anchor>
          <span className="text-xs text-muted">{placement}</span>
        </div>
      ))}
    </div>
  );
}

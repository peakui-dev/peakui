import {Bell} from "@gravity-ui/icons";
import {Avatar, Badge} from "@peakui/react";

const COUNTS = ["5", "99+", "New"] as const;

export function WithContent() {
  return (
    <div className="flex items-center gap-8">
      {COUNTS.map((count) => (
        <Badge.Anchor key={count}>
          <Avatar>
            <Avatar.Fallback>JD</Avatar.Fallback>
          </Avatar>
          <Badge color="danger">{count}</Badge>
        </Badge.Anchor>
      ))}
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        {/* An icon carries no name of its own, and a roleless span cannot take aria-label. */}
        <Badge color="accent">
          <Bell aria-label="New notifications" className="size-3" role="img" />
        </Badge>
      </Badge.Anchor>
    </div>
  );
}

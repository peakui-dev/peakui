import {Avatar, Badge} from "@peakui/react";

export function CustomStyles() {
  return (
    <Badge.Anchor>
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>
      <Badge className="[--badge-bg:var(--color-accent)] [--badge-fg:var(--color-accent-foreground)]">
        New
      </Badge>
    </Badge.Anchor>
  );
}

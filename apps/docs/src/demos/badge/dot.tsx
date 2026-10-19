import {Avatar, Badge} from "@peakui/react";

export function Dot() {
  return (
    <Badge.Anchor>
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>
      <Badge color="success" size="sm" />
    </Badge.Anchor>
  );
}

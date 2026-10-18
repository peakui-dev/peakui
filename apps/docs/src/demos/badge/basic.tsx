import {Avatar, Badge} from "@peakui/react";

export function Basic() {
  return (
    <Badge.Anchor>
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>
      <Badge>5</Badge>
    </Badge.Anchor>
  );
}

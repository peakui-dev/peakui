import {Avatar, Badge} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex items-center gap-8">
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge size="sm">12</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge size="md">12</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge size="lg">12</Badge>
      </Badge.Anchor>
    </div>
  );
}

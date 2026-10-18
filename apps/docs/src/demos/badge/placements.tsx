import {Avatar, Badge} from "@peakui/react";

export function Placements() {
  return (
    <div className="flex items-center gap-8">
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge placement="top-right">1</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge placement="top-left">1</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge placement="bottom-right">1</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge placement="bottom-left">1</Badge>
      </Badge.Anchor>
    </div>
  );
}

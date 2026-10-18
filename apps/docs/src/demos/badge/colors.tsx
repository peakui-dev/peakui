import {Avatar, Badge} from "@peakui/react";

export function Colors() {
  return (
    <div className="flex items-center gap-8">
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="default">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="accent">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="success">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="warning">3</Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="danger">3</Badge>
      </Badge.Anchor>
    </div>
  );
}

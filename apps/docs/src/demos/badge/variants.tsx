import {Avatar, Badge} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex items-center gap-8">
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="accent" variant="primary">
          3
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="accent" variant="secondary">
          3
        </Badge>
      </Badge.Anchor>
      <Badge.Anchor>
        <Avatar>
          <Avatar.Fallback>JD</Avatar.Fallback>
        </Avatar>
        <Badge color="accent" variant="soft">
          3
        </Badge>
      </Badge.Anchor>
    </div>
  );
}

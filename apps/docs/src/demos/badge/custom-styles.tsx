import {Avatar, Badge} from "@peakui/react";

export function CustomStyles() {
  return (
    <Badge.Anchor>
      <Avatar>
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>
      {/* tabular-nums keeps the width steady as the count changes. */}
      <Badge className="min-w-6 font-semibold tabular-nums" color="accent" variant="soft">
        12
      </Badge>
    </Badge.Anchor>
  );
}

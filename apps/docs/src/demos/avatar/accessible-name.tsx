import {Avatar} from "@peakui/react";

export function AccessibleName() {
  return (
    <Avatar aria-label="Jane Doe" role="img">
      <Avatar.Fallback>JD</Avatar.Fallback>
    </Avatar>
  );
}

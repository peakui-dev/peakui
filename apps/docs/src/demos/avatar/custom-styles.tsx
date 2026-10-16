import {Avatar} from "@peakui/react";

export function CustomStyles() {
  return (
    <Avatar className="rounded-lg">
      <Avatar.Fallback className="rounded-lg bg-accent text-accent-foreground">JD</Avatar.Fallback>
    </Avatar>
  );
}

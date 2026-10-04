import {Surface} from "@peakui/react";

export function Basic() {
  return (
    <Surface className="flex flex-col gap-3 rounded-3xl p-6">
      <h3 className="text-base font-semibold text-foreground">Surface Content</h3>
      <p className="text-sm text-muted">The default level, with its matching foreground.</p>
    </Surface>
  );
}

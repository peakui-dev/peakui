import {Input} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-full max-w-md">
      <Input fullWidth aria-label="Search" placeholder="Stretches to its container" />
    </div>
  );
}

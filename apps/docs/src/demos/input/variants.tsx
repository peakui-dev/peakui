import {Input} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex w-64 flex-col gap-3">
      <Input fullWidth aria-label="Primary input" placeholder="Primary" variant="primary" />
      <Input fullWidth aria-label="Secondary input" placeholder="Secondary" variant="secondary" />
    </div>
  );
}

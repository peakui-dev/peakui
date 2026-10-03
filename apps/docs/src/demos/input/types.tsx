import {Input} from "@peakui/react";

export function Types() {
  return (
    <div className="flex w-64 flex-col gap-3">
      <Input fullWidth aria-label="Email" placeholder="jane@example.com" type="email" />
      <Input fullWidth aria-label="Password" placeholder="Password" type="password" />
      <Input fullWidth aria-label="Age" placeholder="Age" type="number" />
    </div>
  );
}

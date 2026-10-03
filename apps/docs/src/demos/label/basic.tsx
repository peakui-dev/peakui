import {Input, Label} from "@peakui/react";

export function Basic() {
  return (
    <div className="flex w-64 flex-col gap-1">
      <Label htmlFor="label-basic-name">Name</Label>
      <Input fullWidth id="label-basic-name" placeholder="Enter your name" />
    </div>
  );
}

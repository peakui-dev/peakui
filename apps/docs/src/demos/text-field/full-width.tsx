import {Input, Label, TextField} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-full max-w-md">
      <TextField fullWidth name="address">
        <Label>Address</Label>
        <Input placeholder="Stretches to its container" />
      </TextField>
    </div>
  );
}

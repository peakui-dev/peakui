import {Input, Label, TextField} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex w-64 flex-col gap-4">
      <TextField fullWidth name="primary" variant="primary">
        <Label>Primary</Label>
        <Input placeholder="For fields on the page background" />
      </TextField>
      <TextField fullWidth name="secondary" variant="secondary">
        <Label>Secondary</Label>
        <Input placeholder="For fields on a surface" />
      </TextField>
    </div>
  );
}

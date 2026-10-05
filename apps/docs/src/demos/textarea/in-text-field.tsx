import {Label, TextArea, TextField} from "@peakui/react";

export function InTextField() {
  return (
    <TextField className="w-[280px]" variant="secondary">
      <Label>Description</Label>
      <TextArea aria-label="Description" placeholder="Describe your product" />
    </TextField>
  );
}

import {Input, Label, TextField} from "@peakui/react";

export function Required() {
  return (
    <TextField isRequired className="w-64" name="name">
      <Label>Full name</Label>
      <Input placeholder="Jane Doe" />
    </TextField>
  );
}

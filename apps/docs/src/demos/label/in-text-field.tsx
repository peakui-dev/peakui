import {Input, Label, TextField} from "@peakui/react";

export function InTextField() {
  return (
    <TextField isRequired className="w-64" name="email" type="email">
      <Label>Email</Label>
      <Input placeholder="jane@example.com" />
    </TextField>
  );
}

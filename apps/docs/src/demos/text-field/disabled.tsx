import {Description, Input, Label, TextField} from "@peakui/react";

export function Disabled() {
  return (
    <TextField isDisabled className="w-64" defaultValue="jane@example.com" name="email">
      <Label>Email</Label>
      <Input />
      <Description>Contact support to change your email.</Description>
    </TextField>
  );
}

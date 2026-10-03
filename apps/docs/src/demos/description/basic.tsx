import {Description, Input, Label, TextField} from "@peakui/react";

export function Basic() {
  return (
    <TextField className="w-64" name="email" type="email">
      <Label>Email</Label>
      <Input placeholder="jane@example.com" />
      <Description>We never share your email with anyone.</Description>
    </TextField>
  );
}

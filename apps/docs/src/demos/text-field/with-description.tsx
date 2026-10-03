import {Description, Input, Label, TextField} from "@peakui/react";

export function WithDescription() {
  return (
    <TextField className="w-64" name="username">
      <Label>Username</Label>
      <Input placeholder="jane" />
      <Description>3 to 20 characters. Letters and numbers only.</Description>
    </TextField>
  );
}

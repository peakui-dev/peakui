import {FieldError, Input, Label, TextField} from "@peakui/react";

export function WithError() {
  return (
    <TextField isInvalid className="w-64" defaultValue="jane@" name="email" type="email">
      <Label>Email</Label>
      <Input />
      <FieldError>Enter a complete email address.</FieldError>
    </TextField>
  );
}

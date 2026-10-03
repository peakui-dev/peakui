import {Description, FieldError, InputGroup, Label, TextField} from "@peakui/react";

export function InTextField() {
  return (
    <div className="flex w-72 flex-col gap-4">
      <TextField fullWidth name="username">
        <Label>Username</Label>
        <InputGroup fullWidth>
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.Input placeholder="username" />
        </InputGroup>
        <Description>Shown on your public profile.</Description>
      </TextField>
      <TextField fullWidth isInvalid name="handle">
        <Label>Handle</Label>
        <InputGroup fullWidth>
          <InputGroup.Prefix>@</InputGroup.Prefix>
          <InputGroup.Input defaultValue="not a handle" />
        </InputGroup>
        <FieldError>A handle cannot contain spaces.</FieldError>
      </TextField>
    </div>
  );
}

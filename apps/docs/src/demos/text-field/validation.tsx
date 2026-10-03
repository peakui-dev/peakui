"use client";

import {Button, Description, FieldError, Input, Label, TextField} from "@peakui/react";

export function Validation() {
  return (
    <form
      className="flex w-64 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextField
        isRequired
        name="username"
        validate={(value) => (value.includes(" ") ? "A username cannot contain spaces." : null)}
      >
        <Label>Username</Label>
        <Input placeholder="jane" />
        <Description>Press the button to validate.</Description>
        <FieldError />
      </TextField>
      <Button type="submit">Continue</Button>
    </form>
  );
}

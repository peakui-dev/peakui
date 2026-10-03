"use client";

import {Button, FieldError, Input, Label, TextField} from "@peakui/react";

export function RenderFunction() {
  return (
    <form
      className="flex w-64 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextField isRequired minLength={8} name="password" type="password">
        <Label>Password</Label>
        <Input placeholder="At least 8 characters" />
        <FieldError>
          {({validationDetails}) =>
            validationDetails.valueMissing ? "Enter a password." : "Use at least 8 characters."
          }
        </FieldError>
      </TextField>
      <Button type="submit">Create account</Button>
    </form>
  );
}

"use client";

import {Button, FieldError, Input, Label, TextField} from "@peakui/react";

export function Validation() {
  return (
    <form
      className="flex w-64 flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="jane@example.com" />
        {/* Without children, FieldError shows the browser's validation message. */}
        <FieldError />
      </TextField>
      <Button type="submit">Subscribe</Button>
    </form>
  );
}

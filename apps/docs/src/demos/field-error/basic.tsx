"use client";

import {FieldError, Input, Label, TextField} from "@peakui/react";
import {useState} from "react";

export function Basic() {
  const [value, setValue] = useState("jr");
  const isInvalid = value.length > 0 && value.length < 3;

  return (
    <TextField
      className="w-64"
      isInvalid={isInvalid}
      name="username"
      value={value}
      onChange={setValue}
    >
      <Label>Username</Label>
      <Input placeholder="Enter a username" />
      <FieldError>A username has at least 3 characters.</FieldError>
    </TextField>
  );
}

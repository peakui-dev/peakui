"use client";

import {Description, Input, Label, TextField} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState("");

  return (
    <TextField className="w-64" name="project" value={value} onChange={setValue}>
      <Label>Project name</Label>
      <Input placeholder="My project" />
      <Description>Characters: {value.length}</Description>
    </TextField>
  );
}

"use client";

import {Input} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-64 flex-col gap-2">
      <Input
        fullWidth
        aria-label="Project name"
        placeholder="Project name"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <p className="text-sm text-muted">Characters: {value.length}</p>
    </div>
  );
}

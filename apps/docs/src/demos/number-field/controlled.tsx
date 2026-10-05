"use client";

import {Label, NumberField} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState<number>(10);

  return (
    <div className="flex flex-col gap-3">
      <NumberField minValue={0} name="width" value={value} onChange={setValue}>
        <Label>Width</Label>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input className="w-[120px]" />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>
      <p className="text-sm text-muted">Value: {value}</p>
    </div>
  );
}

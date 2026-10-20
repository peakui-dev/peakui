"use client";

import {Time} from "@internationalized/date";
import {Button, Description, Label, TimeField} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState<Time | null>(new Time(9, 30));

  return (
    <div className="flex flex-col gap-4">
      <TimeField className="w-64" name="time" value={value} onChange={setValue}>
        <Label>Time</Label>
        <TimeField.Group>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
        <Description>Current value: {value ? value.toString() : "(empty)"}</Description>
      </TimeField>
      <div className="flex gap-2">
        <Button variant="tertiary" onPress={() => setValue(new Time(12))}>
          Set noon
        </Button>
        <Button variant="tertiary" onPress={() => setValue(null)}>
          Clear
        </Button>
      </div>
    </div>
  );
}

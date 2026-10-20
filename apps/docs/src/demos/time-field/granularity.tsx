"use client";

import {Time} from "@internationalized/date";
import {Label, TimeField} from "@peakui/react";

export function Granularity() {
  return (
    <TimeField className="w-64" defaultValue={new Time(8, 45, 12)} granularity="second" name="time">
      <Label>Time with seconds</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
    </TimeField>
  );
}

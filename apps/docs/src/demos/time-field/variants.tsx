"use client";

import {Label, TimeField} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      <TimeField className="w-64" name="primary-time">
        <Label>Primary</Label>
        <TimeField.Group variant="primary">
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
      <TimeField className="w-64" name="secondary-time">
        <Label>Secondary</Label>
        <TimeField.Group variant="secondary">
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
    </div>
  );
}

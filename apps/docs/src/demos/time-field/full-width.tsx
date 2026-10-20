"use client";

import {Label, TimeField} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-96">
      <TimeField fullWidth name="time">
        <Label>Time</Label>
        <TimeField.Group fullWidth>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
    </div>
  );
}

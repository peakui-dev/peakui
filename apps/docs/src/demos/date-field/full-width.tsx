"use client";

import {DateField, Label} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-96">
      <DateField fullWidth name="date">
        <Label>Date</Label>
        <DateField.Group fullWidth>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
      </DateField>
    </div>
  );
}

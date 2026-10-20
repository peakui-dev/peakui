"use client";

import {Description, Label, TimeField} from "@peakui/react";

export function WithDescription() {
  return (
    <TimeField className="w-64" name="meeting">
      <Label>Meeting time</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      <Description>Enter the start of the meeting</Description>
    </TimeField>
  );
}

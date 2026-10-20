"use client";

import {FieldError, Label, TimeField} from "@peakui/react";

export function Invalid() {
  return (
    <TimeField isInvalid className="w-64" name="time">
      <Label>Time</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      <FieldError>Time must be within opening hours</FieldError>
    </TimeField>
  );
}

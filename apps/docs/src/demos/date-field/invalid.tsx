"use client";

import {DateField, FieldError, Label} from "@peakui/react";

export function Invalid() {
  return (
    <DateField isInvalid className="w-64" name="date">
      <Label>Date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
      <FieldError>Date must be in the future</FieldError>
    </DateField>
  );
}

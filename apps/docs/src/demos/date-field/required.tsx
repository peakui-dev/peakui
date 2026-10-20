"use client";

import {DateField, Label} from "@peakui/react";

export function Required() {
  return (
    <DateField isRequired className="w-64" name="start-date">
      <Label>Start date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
    </DateField>
  );
}

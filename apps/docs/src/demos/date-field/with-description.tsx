"use client";

import {DateField, Description, Label} from "@peakui/react";

export function WithDescription() {
  return (
    <DateField className="w-64" name="birth-date">
      <Label>Birth date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
      <Description>Enter your date of birth</Description>
    </DateField>
  );
}

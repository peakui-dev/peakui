"use client";

import {parseZonedDateTime} from "@internationalized/date";
import {DateField, Label} from "@peakui/react";

export function Granularity() {
  return (
    <DateField
      className="w-72"
      defaultValue={parseZonedDateTime("2026-02-03T08:45:00[America/Los_Angeles]")}
      granularity="minute"
      name="appointment"
    >
      <Label>Appointment</Label>
      <DateField.Group>
        <DateField.InputContainer>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.InputContainer>
      </DateField.Group>
    </DateField>
  );
}

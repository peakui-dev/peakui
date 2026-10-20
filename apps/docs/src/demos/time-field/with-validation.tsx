"use client";

import {Time} from "@internationalized/date";
import {Description, FieldError, Label, TimeField} from "@peakui/react";
import {useState} from "react";

export function WithValidation() {
  const [value, setValue] = useState<Time | null>(null);
  const minValue = new Time(9);
  const isInvalid = value !== null && value.compare(minValue) < 0;

  return (
    <TimeField
      isRequired
      className="w-64"
      isInvalid={isInvalid}
      minValue={minValue}
      name="time"
      value={value}
      onChange={setValue}
    >
      <Label>Appointment time</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      {isInvalid ? (
        <FieldError>Appointments start at 9:00 AM</FieldError>
      ) : (
        <Description>Enter a time from 9:00 AM onwards</Description>
      )}
    </TimeField>
  );
}

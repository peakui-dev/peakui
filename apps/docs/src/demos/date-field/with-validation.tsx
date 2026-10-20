"use client";

import type {DateValue} from "@internationalized/date";

import {getLocalTimeZone, today} from "@internationalized/date";
import {DateField, Description, FieldError, Label} from "@peakui/react";
import {useState} from "react";

export function WithValidation() {
  const [value, setValue] = useState<DateValue | null>(null);
  const minValue = today(getLocalTimeZone());
  const isInvalid = value !== null && value.compare(minValue) < 0;

  return (
    <DateField
      isRequired
      className="w-64"
      isInvalid={isInvalid}
      minValue={minValue}
      name="date"
      value={value}
      onChange={setValue}
    >
      <Label>Date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
      {isInvalid ? (
        <FieldError>Date must be today or in the future</FieldError>
      ) : (
        <Description>Enter a date from today onwards</Description>
      )}
    </DateField>
  );
}

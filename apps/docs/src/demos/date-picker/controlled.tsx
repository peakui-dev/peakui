"use client";

import type {DateValue} from "@internationalized/date";

import {getLocalTimeZone, today} from "@internationalized/date";
import {Calendar, DateField, DatePicker, Description, Label} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState<DateValue | null>(today(getLocalTimeZone()));

  return (
    <DatePicker className="w-64" name="date" value={value} onChange={setValue}>
      <Label>Date</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <Description>Current value: {value ? value.toString() : "(empty)"}</Description>
      <DatePicker.Popover>
        <Calendar aria-label="Date">
          <Calendar.Header>
            <Calendar.Heading />
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
          </Calendar.Grid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}

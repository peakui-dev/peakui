"use client";

import {parseZonedDateTime} from "@internationalized/date";
import {Calendar, DateField, DatePicker, Label} from "@peakui/react";

export function Granularity() {
  return (
    <DatePicker
      className="w-80"
      defaultValue={parseZonedDateTime("2026-02-03T08:45:00[America/Los_Angeles]")}
      granularity="minute"
      name="appointment"
    >
      <Label>Date</Label>
      <DateField.Group fullWidth>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>

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

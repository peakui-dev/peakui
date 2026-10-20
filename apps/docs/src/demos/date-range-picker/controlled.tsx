"use client";

import type {DateValue} from "@internationalized/date";

import {getLocalTimeZone, today} from "@internationalized/date";
import {DateField, DateRangePicker, Description, Label, RangeCalendar} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const start = today(getLocalTimeZone());
  const [value, setValue] = useState<{end: DateValue; start: DateValue} | null>({
    end: start.add({days: 4}),
    start,
  });

  return (
    <DateRangePicker
      className="w-80"
      endName="end"
      startName="start"
      value={value}
      onChange={setValue}
    >
      <Label>Trip dates</Label>
      <DateField.Group fullWidth>
        <DateField.Input slot="start">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateRangePicker.RangeSeparator />
        <DateField.Input slot="end">
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          <DateRangePicker.Trigger>
            <DateRangePicker.TriggerIndicator />
          </DateRangePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      <Description>
        Current value: {value ? `${value.start.toString()} to ${value.end.toString()}` : "(empty)"}
      </Description>
      <DateRangePicker.Popover>
        <RangeCalendar aria-label="Dates">
          <RangeCalendar.Header>
            <RangeCalendar.Heading />
            <RangeCalendar.NavButton slot="previous" />
            <RangeCalendar.NavButton slot="next" />
          </RangeCalendar.Header>
          <RangeCalendar.Grid>
            <RangeCalendar.GridHeader>
              {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
            </RangeCalendar.GridHeader>
            <RangeCalendar.GridBody>
              {(date) => <RangeCalendar.Cell date={date} />}
            </RangeCalendar.GridBody>
          </RangeCalendar.Grid>
        </RangeCalendar>
      </DateRangePicker.Popover>
    </DateRangePicker>
  );
}

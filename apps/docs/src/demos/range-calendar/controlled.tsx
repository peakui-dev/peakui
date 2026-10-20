"use client";

import type {DateValue} from "@internationalized/date";

import {Description, RangeCalendar} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState<{end: DateValue; start: DateValue} | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <RangeCalendar aria-label="Trip dates" value={value} onChange={setValue}>
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
      <Description>
        {value ? `${value.start.toString()} to ${value.end.toString()}` : "No range selected"}
      </Description>
    </div>
  );
}

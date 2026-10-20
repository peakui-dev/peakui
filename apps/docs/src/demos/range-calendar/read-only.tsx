"use client";

import {getLocalTimeZone, today} from "@internationalized/date";
import {RangeCalendar} from "@peakui/react";

export function ReadOnly() {
  const now = today(getLocalTimeZone());

  return (
    <RangeCalendar
      isReadOnly
      aria-label="Trip dates"
      defaultValue={{end: now.add({days: 4}), start: now}}
    >
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
  );
}

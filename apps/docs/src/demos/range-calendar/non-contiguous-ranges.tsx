"use client";

import {getLocalTimeZone, today} from "@internationalized/date";
import {RangeCalendar} from "@peakui/react";

export function NonContiguousRanges() {
  const now = today(getLocalTimeZone());
  const blocked = {end: now.add({days: 5}), start: now.add({days: 2})};

  return (
    <RangeCalendar
      allowsNonContiguousRanges
      aria-label="Trip dates"
      defaultValue={{end: now.add({days: 9}), start: now.add({days: 1})}}
      isDateUnavailable={(date) =>
        date.compare(blocked.start) >= 0 && date.compare(blocked.end) <= 0
      }
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

"use client";

import {getLocalTimeZone, today} from "@internationalized/date";
import {RangeCalendar} from "@peakui/react";

export function AnchorUnavailableDates() {
  return (
    <RangeCalendar
      aria-label="Trip dates"
      minValue={today(getLocalTimeZone())}
      isDateUnavailable={(date, anchorDate) =>
        anchorDate != null && Math.abs(date.compare(anchorDate)) > 7
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

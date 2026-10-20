"use client";

import {parseDate} from "@internationalized/date";
import {Calendar} from "@peakui/react";

export function Disabled() {
  return (
    <Calendar isDisabled aria-label="Appointment date" defaultValue={parseDate("2026-02-14")}>
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
  );
}

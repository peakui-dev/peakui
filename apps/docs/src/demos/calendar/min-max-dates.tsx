"use client";

import {getLocalTimeZone, today} from "@internationalized/date";
import {Calendar} from "@peakui/react";

export function MinMaxDates() {
  const now = today(getLocalTimeZone());

  return (
    <Calendar aria-label="Appointment date" maxValue={now.add({months: 3})} minValue={now}>
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

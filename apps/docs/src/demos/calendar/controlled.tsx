"use client";

import type {CalendarDate} from "@internationalized/date";

import {Calendar, Description} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState<CalendarDate | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <Calendar aria-label="Appointment date" value={value} onChange={setValue}>
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
      <Description>Selected: {value ? value.toString() : "none"}</Description>
    </div>
  );
}

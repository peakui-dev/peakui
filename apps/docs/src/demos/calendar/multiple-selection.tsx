"use client";

import type {DateValue} from "@internationalized/date";

import {Calendar} from "@peakui/react";
import {useState} from "react";

export function MultipleSelection() {
  const [value, setValue] = useState<readonly DateValue[]>([]);

  return (
    <Calendar aria-label="Event dates" selectionMode="multiple" value={value} onChange={setValue}>
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

"use client";

import {ArrowLeft, ArrowRight} from "@gravity-ui/icons";
import {Calendar} from "@peakui/react";

export function CustomNavIcons() {
  return (
    <Calendar aria-label="Appointment date">
      <Calendar.Header>
        <Calendar.NavButton slot="previous">
          <ArrowLeft />
        </Calendar.NavButton>
        <Calendar.Heading />
        <Calendar.NavButton slot="next">
          <ArrowRight />
        </Calendar.NavButton>
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

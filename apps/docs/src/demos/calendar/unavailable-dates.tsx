"use client";

import {isWeekend} from "@internationalized/date";
import {Calendar} from "@peakui/react";
import {useLocale} from "react-aria-components/I18nProvider";

export function UnavailableDates() {
  const {locale} = useLocale();

  return (
    <Calendar aria-label="Appointment date" isDateUnavailable={(date) => isWeekend(date, locale)}>
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

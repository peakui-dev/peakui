"use client";

import {isWeekend} from "@internationalized/date";
import {RangeCalendar} from "@peakui/react";
import {useLocale} from "react-aria-components/I18nProvider";

export function UnavailableDates() {
  const {locale} = useLocale();

  return (
    <RangeCalendar aria-label="Trip dates" isDateUnavailable={(date) => isWeekend(date, locale)}>
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

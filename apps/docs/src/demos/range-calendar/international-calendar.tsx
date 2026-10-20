"use client";

import {getLocalTimeZone, today} from "@internationalized/date";
import {RangeCalendar} from "@peakui/react";
import {I18nProvider} from "react-aria-components/I18nProvider";

export function InternationalCalendar() {
  const now = today(getLocalTimeZone());

  return (
    <I18nProvider locale="hi-IN-u-ca-indian">
      <RangeCalendar aria-label="Trip dates" defaultValue={{end: now.add({days: 5}), start: now}}>
        <RangeCalendar.Header>
          <RangeCalendar.YearPickerTrigger>
            <RangeCalendar.YearPickerTriggerHeading />
            <RangeCalendar.YearPickerTriggerIndicator />
          </RangeCalendar.YearPickerTrigger>
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
        <RangeCalendar.YearPickerGrid>
          <RangeCalendar.YearPickerGridBody>
            {({year}) => <RangeCalendar.YearPickerCell year={year} />}
          </RangeCalendar.YearPickerGridBody>
        </RangeCalendar.YearPickerGrid>
      </RangeCalendar>
    </I18nProvider>
  );
}

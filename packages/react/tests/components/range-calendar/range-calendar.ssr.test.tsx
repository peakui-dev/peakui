import type {ReactNode} from "react";

import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {RangeCalendar} from "@/components/range-calendar";

const wrapper = ({children}: {children: ReactNode}) => (
  <I18nProvider locale="en-US">{children}</I18nProvider>
);

const RangeCalendarExample = ({defaultYearPickerOpen}: {defaultYearPickerOpen?: boolean}) => (
  <RangeCalendar
    aria-label="Trip dates"
    defaultValue={{end: new CalendarDate(2026, 8, 20), start: new CalendarDate(2026, 8, 15)}}
    defaultYearPickerOpen={defaultYearPickerOpen}
    maxValue={new CalendarDate(2030, 12, 31)}
    minValue={new CalendarDate(2020, 1, 1)}
  >
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
);

describe("RangeCalendar SSR", () => {
  it("renders and hydrates a month view without mismatches", async () => {
    const {html} = await ssrSmoke(<RangeCalendarExample />, {wrapper});

    expect(html).toContain('data-slot="range-calendar"');
    expect(html).toContain('role="grid"');
    expect(html).toContain('data-slot="range-calendar-cell"');
    expect(html).toContain('data-slot="range-calendar-cell-button"');
  });

  it("renders and hydrates with the year picker open", async () => {
    const {html} = await ssrSmoke(<RangeCalendarExample defaultYearPickerOpen />, {wrapper});

    expect(html).toContain('data-slot="calendar-year-picker-grid"');
    expect(html).toContain('data-open="true"');
  });
});

import type {ReactNode} from "react";

import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Calendar} from "@/components/calendar";

const wrapper = ({children}: {children: ReactNode}) => (
  <I18nProvider locale="en-US">{children}</I18nProvider>
);

const CalendarExample = ({defaultYearPickerOpen}: {defaultYearPickerOpen?: boolean}) => (
  <Calendar
    aria-label="Event date"
    defaultValue={new CalendarDate(2026, 8, 15)}
    defaultYearPickerOpen={defaultYearPickerOpen}
    maxValue={new CalendarDate(2030, 12, 31)}
    minValue={new CalendarDate(2020, 1, 1)}
  >
    <Calendar.Header>
      <Calendar.YearPickerTrigger>
        <Calendar.YearPickerTriggerHeading />
        <Calendar.YearPickerTriggerIndicator />
      </Calendar.YearPickerTrigger>
      <Calendar.NavButton slot="previous" />
      <Calendar.NavButton slot="next" />
    </Calendar.Header>
    <Calendar.Grid>
      <Calendar.GridHeader>
        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
      </Calendar.GridHeader>
      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
    </Calendar.Grid>
    <Calendar.YearPickerGrid>
      <Calendar.YearPickerGridBody>
        {({year}) => <Calendar.YearPickerCell year={year} />}
      </Calendar.YearPickerGridBody>
    </Calendar.YearPickerGrid>
  </Calendar>
);

describe("Calendar SSR", () => {
  it("renders and hydrates a month view without mismatches", async () => {
    const {html} = await ssrSmoke(<CalendarExample />, {wrapper});

    expect(html).toContain('data-slot="calendar"');
    expect(html).toContain('role="grid"');
    expect(html).toContain('data-slot="calendar-cell"');
  });

  it("renders and hydrates with the year picker open", async () => {
    const {html} = await ssrSmoke(<CalendarExample defaultYearPickerOpen />, {wrapper});

    expect(html).toContain('data-slot="calendar-year-picker-grid"');
    expect(html).toContain('data-open="true"');
    expect(html).toContain("2026");
  });
});

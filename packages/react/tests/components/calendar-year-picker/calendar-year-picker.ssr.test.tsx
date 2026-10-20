import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Calendar} from "@/components/calendar/index.ts";
import {CalendarYearPicker} from "@/components/calendar-year-picker/index.ts";

describe("CalendarYearPicker SSR", () => {
  it("renders the trigger and the grid inside a Calendar without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <I18nProvider locale="en-US">
        <Calendar
          defaultYearPickerOpen
          aria-label="Event date"
          defaultValue={new CalendarDate(2026, 8, 15)}
          maxValue={new CalendarDate(2030, 12, 31)}
          minValue={new CalendarDate(2020, 1, 1)}
        >
          <CalendarYearPicker.Trigger>
            <CalendarYearPicker.TriggerHeading />
            <CalendarYearPicker.TriggerIndicator />
          </CalendarYearPicker.Trigger>
          <CalendarYearPicker.Grid>
            <CalendarYearPicker.GridBody />
          </CalendarYearPicker.Grid>
        </Calendar>
      </I18nProvider>,
    );

    expect(html).toContain('data-slot="calendar-year-picker-trigger"');
    expect(html).toContain('data-slot="calendar-year-picker-grid"');
    expect(html).toContain('data-slot="calendar-year-picker-year-cell"');
  });
});

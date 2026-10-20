import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";

import {Calendar} from "@/components/calendar/index.ts";
import {DateField} from "@/components/date-field/index.ts";
import {DatePicker} from "@/components/date-picker/index.ts";
import {Label} from "@/components/label/index.ts";

describe("DatePicker SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <DatePicker defaultValue={new CalendarDate(2026, 8, 15)} name="date">
        <Label>Date</Label>
        <DateField.Group>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        <DatePicker.Popover>
          <Calendar aria-label="Date" />
        </DatePicker.Popover>
      </DatePicker>,
    );

    expect(html).toContain('data-slot="date-picker"');
    expect(html).toContain('data-slot="date-picker-trigger"');
    expect(html).toContain('data-slot="date-picker-trigger-indicator"');
    expect(html).not.toContain('data-slot="date-picker-popover"');
  });
});

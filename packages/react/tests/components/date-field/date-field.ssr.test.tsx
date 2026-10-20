import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";

import {DateField} from "@/components/date-field/index.ts";
import {Label} from "@/components/label/index.ts";

describe("DateField SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <DateField defaultValue={new CalendarDate(2026, 8, 15)} name="date">
        <Label>Date</Label>
        <DateField.Group>
          <DateField.Prefix>from</DateField.Prefix>
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
      </DateField>,
    );

    expect(html).toContain('data-slot="date-field"');
    expect(html).toContain('data-slot="date-input-group"');
    expect(html).toContain('data-slot="date-input-group-segment"');
  });
});

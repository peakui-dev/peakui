import {CalendarDate} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";

import {DateField} from "@/components/date-field/index.ts";
import {DateInputGroup} from "@/components/date-input-group/index.ts";

describe("DateInputGroup SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <DateField aria-label="Date" defaultValue={new CalendarDate(2026, 8, 15)}>
        <DateInputGroup variant="secondary">
          <DateInputGroup.Prefix>from</DateInputGroup.Prefix>
          <DateInputGroup.InputContainer>
            <DateInputGroup.Input>
              {(segment) => <DateInputGroup.Segment segment={segment} />}
            </DateInputGroup.Input>
          </DateInputGroup.InputContainer>
          <DateInputGroup.Suffix>UTC</DateInputGroup.Suffix>
        </DateInputGroup>
      </DateField>,
    );

    expect(html).toContain('data-slot="date-input-group"');
    expect(html).toContain('data-slot="date-input-group-prefix"');
    expect(html).toContain('data-slot="date-input-group-input-container"');
    expect(html).toContain('data-slot="date-input-group-suffix"');
  });
});

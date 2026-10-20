import {Time} from "@internationalized/date";
import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {TimeField} from "@/components/time-field/index.ts";

describe("TimeField SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <TimeField defaultValue={new Time(9, 30)} name="time">
        <Label>Time</Label>
        <TimeField.Group>
          <TimeField.Prefix>at</TimeField.Prefix>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>,
    );

    expect(html).toContain('data-slot="time-field"');
    expect(html).toContain('data-slot="date-input-group"');
    expect(html).toContain('data-slot="date-input-group-segment"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {DateRangePicker} from "@/components/date-range-picker";

describe("DateRangePicker SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<DateRangePicker>Content</DateRangePicker>);

    expect(html).toContain('data-slot="date-range-picker"');
  });
});

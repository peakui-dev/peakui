import {ssrSmoke} from "@peakui/testing/helpers";

import {Meter} from "@/components/meter";

describe("Meter SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Meter aria-label="Storage" value={40}>
        <Meter.Output />
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>,
    );

    expect(html).toContain('data-slot="meter"');
    expect(html).toContain('data-slot="meter-fill"');
  });
});

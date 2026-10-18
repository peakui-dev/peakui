import {ssrSmoke} from "@peakui/testing/helpers";

import {ProgressCircle} from "@/components/progress-circle";

describe("ProgressCircle SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ProgressCircle aria-label="Loading" value={60}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>,
    );

    expect(html).toContain('data-slot="progress-circle"');
    expect(html).toContain('data-slot="progress-circle-fill-circle"');
  });
});

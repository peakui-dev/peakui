import {ssrSmoke} from "@peakui/testing/helpers";

import {SegmentedControl} from "@/components/segmented-control";

describe("SegmentedControl SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<SegmentedControl>Content</SegmentedControl>);

    expect(html).toContain('data-slot="segmented-control"');
  });
});

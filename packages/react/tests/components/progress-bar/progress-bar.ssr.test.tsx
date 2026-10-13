import {ssrSmoke} from "@peakui/testing/helpers";

import {ProgressBar} from "@/components/progress-bar";

describe("ProgressBar SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<ProgressBar aria-label="Loading">Content</ProgressBar>);

    expect(html).toContain('data-slot="progress-bar"');
  });
});

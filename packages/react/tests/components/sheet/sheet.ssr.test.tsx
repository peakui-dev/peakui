import {ssrSmoke} from "@peakui/testing/helpers";

import {Sheet} from "@/components/sheet";

describe("Sheet SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<Sheet>Content</Sheet>);

    expect(html).toContain('data-slot="sheet"');
  });
});

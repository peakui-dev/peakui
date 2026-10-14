import {ssrSmoke} from "@peakui/testing/helpers";

import {Select} from "@/components/select";

describe("Select SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<Select>Content</Select>);

    expect(html).toContain('data-slot="select"');
  });
});

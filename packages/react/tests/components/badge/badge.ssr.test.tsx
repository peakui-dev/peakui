import {ssrSmoke} from "@peakui/testing/helpers";

import {Badge} from "@/components/badge";

describe("Badge SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Badge.Anchor>
        <span>Inbox</span>
        <Badge>5</Badge>
      </Badge.Anchor>,
    );

    expect(html).toContain('data-slot="badge-anchor"');
    expect(html).toContain('data-slot="badge-label"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {Avatar} from "@/components/avatar/index.ts";

describe("Avatar SSR", () => {
  it("renders the root and the fallback without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Avatar>
        <Avatar.Image alt="Jane Doe" src="https://example.test/jane.png" />
        <Avatar.Fallback>JD</Avatar.Fallback>
      </Avatar>,
    );

    expect(html).toContain('data-slot="avatar"');
    expect(html).toContain('data-slot="avatar-fallback"');
    expect(html).toContain("JD");
  });
});

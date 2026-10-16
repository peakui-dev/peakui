import {ssrSmoke} from "@peakui/testing/helpers";

import {Avatar} from "@/components/avatar/index.ts";
import {AvatarGroup} from "@/components/avatar-group/index.ts";

describe("AvatarGroup SSR", () => {
  it("renders the group, its avatars and the overflow count without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <AvatarGroup max={2}>
        {["A", "B", "C"].map((name) => (
          <Avatar key={name}>
            <Avatar.Fallback>{name}</Avatar.Fallback>
          </Avatar>
        ))}
      </AvatarGroup>,
    );

    expect(html).toContain('data-slot="avatar-group"');
    expect(html).toContain('data-slot="avatar-group-count"');
    expect(html).toContain("+1");
  });
});

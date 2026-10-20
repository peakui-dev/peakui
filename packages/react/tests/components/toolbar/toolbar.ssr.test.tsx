import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button/index.ts";
import {Toolbar} from "@/components/toolbar/index.ts";

describe("Toolbar SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Toolbar isAttached aria-label="Tools" orientation="vertical">
        <Button>One</Button>
      </Toolbar>,
    );

    expect(html).toContain('data-slot="toolbar"');
    expect(html).toContain("toolbar--vertical");
    expect(html).toContain("toolbar--attached");
  });
});

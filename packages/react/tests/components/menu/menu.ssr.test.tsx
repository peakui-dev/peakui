import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Menu} from "@/components/menu/index.ts";

describe("Menu SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Menu aria-label="Actions">
        <Menu.Item id="new" textValue="New">
          <Label>New</Label>
        </Menu.Item>
      </Menu>,
    );

    expect(html).toContain('data-slot="menu"');
  });
});

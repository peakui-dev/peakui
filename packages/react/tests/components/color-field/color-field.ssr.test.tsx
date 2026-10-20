import {ssrSmoke} from "@peakui/testing/helpers";
import {Input} from "react-aria-components";

import {ColorField} from "@/components/color-field/index.ts";

describe("ColorField SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorField aria-label="Hex" defaultValue="#ff5733">
        <Input />
      </ColorField>,
    );

    expect(html).toContain('data-slot="color-field"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {ColorArea} from "@/components/color-area/index.ts";

describe("ColorArea SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorArea aria-label="Colour area" defaultValue="hsb(210, 100%, 100%)">
        <ColorArea.Thumb />
      </ColorArea>,
    );

    expect(html).toContain('data-slot="color-area"');
    expect(html).toContain('data-slot="color-area-thumb"');
  });
});

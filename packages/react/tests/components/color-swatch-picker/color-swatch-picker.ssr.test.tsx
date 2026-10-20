import {ssrSmoke} from "@peakui/testing/helpers";

import {ColorSwatchPicker} from "@/components/color-swatch-picker/index.ts";

describe("ColorSwatchPicker SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorSwatchPicker aria-label="Palette" defaultValue="#ef4444">
        <ColorSwatchPicker.Item color="#ef4444">
          <ColorSwatchPicker.Swatch />
          <ColorSwatchPicker.Indicator />
        </ColorSwatchPicker.Item>
      </ColorSwatchPicker>,
    );

    expect(html).toContain('data-slot="color-swatch-picker"');
    expect(html).toContain('data-slot="color-swatch-picker-item"');
  });
});

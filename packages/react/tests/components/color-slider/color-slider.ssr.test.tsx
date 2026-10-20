import {ssrSmoke} from "@peakui/testing/helpers";

import {ColorSlider} from "@/components/color-slider/index.ts";

describe("ColorSlider SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorSlider channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)">
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>,
    );

    expect(html).toContain('data-slot="color-slider"');
    expect(html).toContain('data-slot="color-slider-track"');
  });
});

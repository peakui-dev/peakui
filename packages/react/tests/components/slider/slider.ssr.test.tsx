import {ssrSmoke} from "@peakui/testing/helpers";

import {Slider} from "@/components/slider/index.ts";

describe("Slider SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <Slider aria-label="Громкость" defaultValue={30}>
        <Slider.Output />
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>,
    );

    expect(html).toContain('data-slot="slider"');
    expect(html).toContain('data-slot="slider-track"');
    expect(html).toContain('data-slot="slider-fill"');
    expect(html).toContain('data-slot="slider-thumb"');
    expect(html).toContain('data-slot="slider-output"');
  });
});

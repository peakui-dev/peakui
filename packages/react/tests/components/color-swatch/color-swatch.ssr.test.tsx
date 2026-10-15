import {ssrSmoke} from "@peakui/testing/helpers";
import {parseColor} from "react-aria-components";

import {ColorSwatch} from "@/components/color-swatch";

describe("ColorSwatch SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(<ColorSwatch aria-label="Green" color={parseColor("#00ff00")} />);

    expect(html).toContain('data-slot="color-swatch"');
    expect(html).toContain("--color-swatch-current");
  });
});

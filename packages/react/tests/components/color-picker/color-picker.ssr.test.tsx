import {ssrSmoke} from "@peakui/testing/helpers";
import {parseColor} from "react-aria-components";

import {ColorPicker} from "@/components/color-picker";
import {ColorSwatch} from "@/components/color-swatch";

describe("ColorPicker SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorPicker defaultValue={parseColor("#ff5733")}>
        <ColorPicker.Trigger aria-label="Accent colour">
          <ColorSwatch aria-label="Current colour" />
        </ColorPicker.Trigger>
      </ColorPicker>,
    );

    expect(html).toContain('data-slot="color-picker"');
    expect(html).toContain('data-slot="color-picker-trigger"');
    expect(html).toContain("--color-swatch-current");
  });
});

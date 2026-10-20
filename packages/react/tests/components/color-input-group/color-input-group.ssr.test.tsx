import {ssrSmoke} from "@peakui/testing/helpers";

import {ColorField} from "@/components/color-field/index.ts";
import {ColorInputGroup} from "@/components/color-input-group/index.ts";
import {ColorSwatch} from "@/components/color-swatch/index.ts";

describe("ColorInputGroup SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ColorField aria-label="Hex" defaultValue="#ff5733">
        <ColorInputGroup variant="secondary">
          <ColorInputGroup.Prefix>
            <ColorSwatch aria-label="Current colour" size="xs" />
          </ColorInputGroup.Prefix>
          <ColorInputGroup.Input />
        </ColorInputGroup>
      </ColorField>,
    );

    expect(html).toContain('data-slot="color-input-group"');
    expect(html).toContain('data-slot="color-input-group-prefix"');
  });
});

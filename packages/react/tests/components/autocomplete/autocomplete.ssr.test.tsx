import {ssrSmoke} from "@peakui/testing/helpers";

import {Autocomplete} from "@/components/autocomplete/index.ts";

describe("Autocomplete SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <Autocomplete aria-label="Fruit">
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
      </Autocomplete>,
    );

    expect(html).toContain('data-slot="autocomplete"');
    expect(html).toContain('data-slot="autocomplete-trigger"');
  });
});

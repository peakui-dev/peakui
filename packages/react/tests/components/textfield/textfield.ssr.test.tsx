import {ssrSmoke} from "@peakui/testing/helpers";

import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";

describe("TextField SSR", () => {
  it("renders a labelled field without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <TextField>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(html).toContain('data-slot="textfield"');
    expect(html).toContain('data-slot="label"');
  });

  it("renders an invalid field without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <TextField isInvalid>
        <Label>City</Label>
        <Input />
      </TextField>,
    );

    expect(html).toContain('data-invalid="true"');
  });
});

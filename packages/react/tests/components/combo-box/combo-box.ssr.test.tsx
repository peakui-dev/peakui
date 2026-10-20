import {ssrSmoke} from "@peakui/testing/helpers";

import {ComboBox} from "@/components/combo-box/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {ListBox} from "@/components/list-box/index.ts";

describe("ComboBox SSR", () => {
  it("renders without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ComboBox>
        <Label>Animal</Label>
        <ComboBox.InputGroup>
          <Input />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Popover>
          <ListBox>
            <ListBox.Item id="cat" textValue="Cat">
              Cat
            </ListBox.Item>
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>,
    );

    expect(html).toContain('data-slot="combo-box"');
    expect(html).toContain('data-slot="combo-box-trigger"');
  });
});

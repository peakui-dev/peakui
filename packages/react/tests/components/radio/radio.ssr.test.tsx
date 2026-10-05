import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Radio} from "@/components/radio/index.ts";
import {RadioGroup} from "@/components/radio-group/index.ts";

describe("Radio SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <RadioGroup defaultValue="a">
        <Label>Группа</Label>
        <Radio value="a">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            <Label>Опция</Label>
          </Radio.Content>
        </Radio>
      </RadioGroup>,
    );

    expect(html).toContain('data-slot="radio"');
    expect(html).toContain('data-slot="radio-content"');
  });
});

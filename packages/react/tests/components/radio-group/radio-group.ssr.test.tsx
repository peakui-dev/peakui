import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Radio} from "@/components/radio/index.ts";
import {RadioGroup} from "@/components/radio-group/index.ts";

describe("RadioGroup SSR", () => {
  it("рендерится без расхождения гидратации с дочерними радиокнопками", async () => {
    const {html} = await ssrSmoke(
      <RadioGroup aria-label="Размер">
        <Label>Размер</Label>
        <Radio value="md">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
          </Radio.Content>
        </Radio>
      </RadioGroup>,
    );

    expect(html).toContain('data-slot="radio-group"');
    expect(html).toContain('role="radiogroup"');
  });
});

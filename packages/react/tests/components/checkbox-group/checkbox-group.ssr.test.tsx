import {ssrSmoke} from "@peakui/testing/helpers";

import {Checkbox} from "@/components/checkbox/index.ts";
import {CheckboxGroup} from "@/components/checkbox-group/index.ts";

describe("CheckboxGroup SSR", () => {
  it("рендерится без расхождения гидратации с дочерними чекбоксами", async () => {
    const {html} = await ssrSmoke(
      <CheckboxGroup aria-label="Каналы">
        <Checkbox value="email">
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
          </Checkbox.Content>
        </Checkbox>
      </CheckboxGroup>,
    );

    expect(html).toContain('data-slot="checkbox-group"');
    expect(html).toContain('role="group"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {Checkbox} from "@/components/checkbox/index.ts";
import {Label} from "@/components/label/index.ts";

describe("Checkbox SSR", () => {
  it("рендерится без расхождения гидратации в закрытом состоянии", async () => {
    const {html} = await ssrSmoke(
      <Checkbox aria-label="Опция">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          <Label>Опция</Label>
        </Checkbox.Content>
      </Checkbox>,
    );

    expect(html).toContain('data-slot="checkbox"');
    expect(html).toContain('data-slot="checkbox-content"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {NumberField} from "@/components/number-field/index.ts";

describe("NumberField SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <NumberField aria-label="Количество" defaultValue={5}>
        <NumberField.Group>
          <NumberField.DecrementButton />
          <NumberField.Input />
          <NumberField.IncrementButton />
        </NumberField.Group>
      </NumberField>,
    );

    expect(html).toContain('data-slot="number-field"');
    expect(html).toContain('data-slot="number-field-group"');
  });
});

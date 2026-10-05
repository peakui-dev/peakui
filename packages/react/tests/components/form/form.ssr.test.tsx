import {ssrSmoke} from "@peakui/testing/helpers";

import {Form} from "@/components/form/index.ts";
import {Input} from "@/components/input/index.ts";
import {Label} from "@/components/label/index.ts";
import {TextField} from "@/components/textfield/index.ts";

describe("Form SSR", () => {
  it("рендерится без расхождения гидратации с полями", async () => {
    const {html} = await ssrSmoke(
      <Form aria-label="Настройки">
        <TextField isRequired name="email">
          <Label>Почта</Label>
          <Input />
        </TextField>
      </Form>,
    );

    expect(html).toContain("<form");
    expect(html).toContain('data-slot="form"');
  });
});

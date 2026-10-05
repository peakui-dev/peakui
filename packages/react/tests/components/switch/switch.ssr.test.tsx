import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Switch} from "@/components/switch/index.ts";

describe("Switch SSR", () => {
  it("рендерится без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <Switch aria-label="Уведомления">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label>Уведомления</Label>
        </Switch.Content>
      </Switch>,
    );

    expect(html).toContain('data-slot="switch"');
    expect(html).toContain('data-slot="switch-content"');
  });
});

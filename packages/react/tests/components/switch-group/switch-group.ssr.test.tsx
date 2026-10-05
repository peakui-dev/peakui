import {ssrSmoke} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Switch} from "@/components/switch/index.ts";
import {SwitchGroup} from "@/components/switch-group/index.ts";

describe("SwitchGroup SSR", () => {
  it("рендерится без расхождения гидратации с дочерними переключателями", async () => {
    const {html} = await ssrSmoke(
      <SwitchGroup aria-label="Настройки">
        <Switch>
          <Switch.Content>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Label>Почта</Label>
          </Switch.Content>
        </Switch>
      </SwitchGroup>,
    );

    expect(html).toContain('data-slot="switch-group"');
    expect(html).toContain('data-slot="switch-group-items"');
  });
});

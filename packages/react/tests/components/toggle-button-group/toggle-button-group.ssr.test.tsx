import {ssrSmoke} from "@peakui/testing/helpers";

import {ToggleButton} from "@/components/toggle-button/index.ts";
import {ToggleButtonGroup} from "@/components/toggle-button-group/index.ts";

describe("ToggleButtonGroup SSR", () => {
  it("рендерится на сервере без рассинхронизации гидратации", async () => {
    const {html} = await ssrSmoke(
      <ToggleButtonGroup defaultSelectedKeys={["bold"]} selectionMode="multiple">
        <ToggleButton id="bold">Жирный</ToggleButton>
        <ToggleButton id="italic">
          <ToggleButtonGroup.Separator />
          Курсив
        </ToggleButton>
      </ToggleButtonGroup>,
    );

    expect(html).toContain('data-slot="toggle-button-group"');
    expect(html).toContain('data-slot="toggle-button-group-separator"');
  });
});

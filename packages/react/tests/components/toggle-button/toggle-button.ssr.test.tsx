import {ssrSmoke} from "@peakui/testing/helpers";

import {ToggleButton} from "@/components/toggle-button/index.ts";

describe("ToggleButton SSR", () => {
  it("рендерится на сервере без рассинхронизации гидратации", async () => {
    const {html} = await ssrSmoke(<ToggleButton>Жирный</ToggleButton>);

    expect(html).toContain('data-slot="toggle-button"');
  });

  it("рендерит выбранное состояние в html", async () => {
    const {html} = await ssrSmoke(<ToggleButton defaultSelected>Жирный</ToggleButton>);

    expect(html).toContain('aria-pressed="true"');
  });
});

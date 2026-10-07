import {ssrSmoke} from "@peakui/testing/helpers";

import {SegmentedControl} from "@/components/segmented-control/index.ts";

describe("SegmentedControl SSR", () => {
  it("рендерится на сервере без рассинхронизации гидратации", async () => {
    const {html} = await ssrSmoke(
      <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
        <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
        <SegmentedControl.Item id="list">Список</SegmentedControl.Item>
        <SegmentedControl.Item id="table">Таблица</SegmentedControl.Item>
      </SegmentedControl>,
    );

    expect(html).toContain('data-slot="segmented-control"');
    expect(html).toContain('data-slot="segmented-control-item"');
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('role="radio"');
  });

  it("отдаёт индикатор уже с сервера, чтобы капсула не въезжала после гидратации", async () => {
    const {html} = await ssrSmoke(
      <SegmentedControl aria-label="Вид" defaultSelectedKey="list">
        <SegmentedControl.Item id="grid">Сетка</SegmentedControl.Item>
        <SegmentedControl.Item id="list">Список</SegmentedControl.Item>
      </SegmentedControl>,
    );

    expect(html).toContain('data-slot="segmented-control-indicator"');
    expect(html.match(/data-slot="segmented-control-indicator"/g)).toHaveLength(1);
  });
});

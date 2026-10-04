import {ssrSmoke} from "@peakui/testing/helpers";

import {Tabs} from "@/components/tabs/index.ts";

describe("Tabs SSR", () => {
  it("рендерится без гидратационного расхождения в полной раскладке", async () => {
    const {html} = await ssrSmoke(
      <Tabs>
        <Tabs.ListContainer>
          <Tabs.List aria-label="Sections">
            <Tabs.Tab id="overview">
              Overview
              <Tabs.Indicator />
            </Tabs.Tab>
            <Tabs.Tab id="analytics">
              Analytics
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
        <Tabs.Panel id="overview">Overview panel</Tabs.Panel>
        <Tabs.Panel id="analytics">Analytics panel</Tabs.Panel>
      </Tabs>,
    );

    expect(html).toContain('data-slot="tabs"');
    expect(html).toContain('data-slot="tabs-list-container"');
    expect(html).toContain('data-slot="tabs-panel"');
  });

  it("рендерит вертикальную ориентацию с атрибутом на корне", async () => {
    const {html} = await ssrSmoke(
      <Tabs orientation="vertical">
        <Tabs.List aria-label="Sections">
          <Tabs.Tab id="overview">Overview</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel id="overview">Overview panel</Tabs.Panel>
      </Tabs>,
    );

    expect(html).toContain('data-orientation="vertical"');
  });
});

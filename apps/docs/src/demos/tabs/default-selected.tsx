import {Tabs} from "@peakui/react";

export function DefaultSelected() {
  return (
    <Tabs defaultSelectedKey="reports">
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
          <Tabs.Tab id="reports">
            Reports
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="overview">Project overview and recent activity.</Tabs.Panel>
      <Tabs.Panel id="analytics">Metrics and performance data.</Tabs.Panel>
      <Tabs.Panel id="reports">This tab is selected by default.</Tabs.Panel>
    </Tabs>
  );
}

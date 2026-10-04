import {Tabs} from "@peakui/react";

export function WithSeparator() {
  return (
    <Tabs>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab id="overview">
            Overview
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="analytics">
            <Tabs.Separator />
            Analytics
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="reports">
            <Tabs.Separator />
            Reports
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="overview">Project overview and recent activity.</Tabs.Panel>
      <Tabs.Panel id="analytics">Metrics and performance data.</Tabs.Panel>
      <Tabs.Panel id="reports">Detailed reports.</Tabs.Panel>
    </Tabs>
  );
}

"use client";

import {Tabs} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [selected, setSelected] = useState<string | number>("analytics");

  return (
    <Tabs selectedKey={selected} onSelectionChange={setSelected}>
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
      <Tabs.Panel id="analytics">Selected: {selected}.</Tabs.Panel>
      <Tabs.Panel id="reports">Detailed reports.</Tabs.Panel>
    </Tabs>
  );
}

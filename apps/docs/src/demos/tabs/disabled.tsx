import {Tabs} from "@peakui/react";

export function Disabled() {
  return (
    <Tabs>
      <Tabs.ListContainer>
        <Tabs.List aria-label="Sections">
          <Tabs.Tab id="active">
            Active
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab isDisabled id="archived">
            Archived
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="drafts">
            Drafts
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="active">This tab is active and selectable.</Tabs.Panel>
      <Tabs.Panel id="archived">This content cannot be accessed.</Tabs.Panel>
      <Tabs.Panel id="drafts">This tab is also selectable.</Tabs.Panel>
    </Tabs>
  );
}

import {Tabs} from "@peakui/react";

export function Vertical() {
  return (
    <Tabs orientation="vertical">
      <Tabs.ListContainer>
        <Tabs.List aria-label="Settings sections">
          <Tabs.Tab id="account">
            Account
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="security">
            Security
            <Tabs.Indicator />
          </Tabs.Tab>
          <Tabs.Tab id="notifications">
            Notifications
            <Tabs.Indicator />
          </Tabs.Tab>
        </Tabs.List>
      </Tabs.ListContainer>
      <Tabs.Panel id="account">Account information and preferences.</Tabs.Panel>
      <Tabs.Panel id="security">Two-factor authentication and password settings.</Tabs.Panel>
      <Tabs.Panel id="notifications">Choose how and when you get notified.</Tabs.Panel>
    </Tabs>
  );
}

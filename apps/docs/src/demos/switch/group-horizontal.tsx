import {Label, Switch, SwitchGroup} from "@peakui/react";

export function GroupHorizontal() {
  return (
    <SwitchGroup aria-label="Preferences" className="overflow-x-auto" orientation="horizontal">
      <Label>Preferences</Label>
      <Switch name="notifications">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Notifications
        </Switch.Content>
      </Switch>
      <Switch name="marketing">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Marketing
        </Switch.Content>
      </Switch>
      <Switch name="social">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Social
        </Switch.Content>
      </Switch>
    </SwitchGroup>
  );
}

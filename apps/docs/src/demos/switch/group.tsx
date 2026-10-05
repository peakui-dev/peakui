import {Label, Switch, SwitchGroup} from "@peakui/react";

export function Group() {
  return (
    <SwitchGroup aria-label="Preferences">
      <Label>Preferences</Label>
      <Switch name="notifications">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Allow notifications
        </Switch.Content>
      </Switch>
      <Switch name="marketing">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Marketing emails
        </Switch.Content>
      </Switch>
      <Switch name="social">
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          Social media updates
        </Switch.Content>
      </Switch>
    </SwitchGroup>
  );
}

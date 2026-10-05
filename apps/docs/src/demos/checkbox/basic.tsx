import {Checkbox} from "@peakui/react";

export function Basic() {
  return (
    <Checkbox name="terms">
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        Accept terms and conditions
      </Checkbox.Content>
    </Checkbox>
  );
}

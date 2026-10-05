import {Checkbox, Description} from "@peakui/react";

export function Disabled() {
  return (
    <Checkbox isDisabled name="feature">
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        Feature
      </Checkbox.Content>
      <Description>This feature is coming soon</Description>
    </Checkbox>
  );
}

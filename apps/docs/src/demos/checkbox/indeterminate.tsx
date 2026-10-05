import {Checkbox, Description} from "@peakui/react";

export function Indeterminate() {
  return (
    <Checkbox isIndeterminate name="select-all">
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        Select all
      </Checkbox.Content>
      <Description>Shows indeterminate state</Description>
    </Checkbox>
  );
}

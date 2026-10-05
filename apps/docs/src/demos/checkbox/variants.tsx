import {Checkbox, Description} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      <Checkbox name="primary" variant="primary">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Primary checkbox
        </Checkbox.Content>
        <Description>Standard styling with default background</Description>
      </Checkbox>
      <Checkbox name="secondary" variant="secondary">
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Secondary checkbox
        </Checkbox.Content>
        <Description>Lower emphasis variant for use in surfaces</Description>
      </Checkbox>
    </div>
  );
}

import {Description, Label, Radio, RadioGroup} from "@peakui/react";

export function Disabled() {
  return (
    <RadioGroup isDisabled defaultValue="md">
      <Label>Size</Label>
      <Radio value="sm">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Small
        </Radio.Content>
        <Description>Unavailable</Description>
      </Radio>
      <Radio value="md">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Medium
        </Radio.Content>
        <Description>Unavailable</Description>
      </Radio>
    </RadioGroup>
  );
}

import {Description, Label, Radio, RadioGroup} from "@peakui/react";

export function Basic() {
  return (
    <RadioGroup defaultValue="md">
      <Label>Size</Label>
      <Radio value="sm">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Small
        </Radio.Content>
        <Description>38 cm</Description>
      </Radio>
      <Radio value="md">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Medium
        </Radio.Content>
        <Description>45 cm</Description>
      </Radio>
      <Radio value="lg">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Large
        </Radio.Content>
        <Description>60 cm</Description>
      </Radio>
    </RadioGroup>
  );
}

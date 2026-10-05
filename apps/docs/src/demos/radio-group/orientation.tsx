import {Label, Radio, RadioGroup} from "@peakui/react";

export function Orientation() {
  return (
    <div className="flex gap-10">
      <RadioGroup defaultValue="a" orientation="vertical">
        <Label>Vertical</Label>
        <Radio value="a">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            First
          </Radio.Content>
        </Radio>
        <Radio value="b">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Second
          </Radio.Content>
        </Radio>
      </RadioGroup>
      <RadioGroup defaultValue="a" orientation="horizontal">
        <Label>Horizontal</Label>
        <Radio value="a">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            First
          </Radio.Content>
        </Radio>
        <Radio value="b">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Second
          </Radio.Content>
        </Radio>
      </RadioGroup>
    </div>
  );
}

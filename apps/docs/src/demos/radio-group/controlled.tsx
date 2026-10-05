"use client";

import {Label, Radio, RadioGroup} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [value, setValue] = useState("md");

  return (
    <RadioGroup className="min-w-[320px]" value={value} onChange={setValue}>
      <Label>Size</Label>
      <Radio value="sm">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Small
        </Radio.Content>
      </Radio>
      <Radio value="md">
        <Radio.Content>
          <Radio.Control>
            <Radio.Indicator />
          </Radio.Control>
          Medium
        </Radio.Content>
      </Radio>
      <Label className="my-4 text-sm text-muted">Selected: {value}</Label>
    </RadioGroup>
  );
}

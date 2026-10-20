"use client";

import {ComboBox, Input, Label, ListBox} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-6">
      {(["primary", "secondary"] as const).map((variant) => (
        <ComboBox key={variant} className="w-[256px]" variant={variant}>
          <Label>{variant}</Label>
          <ComboBox.InputGroup>
            <Input placeholder="Search animals..." />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <ComboBox.Popover>
            <ListBox>
              <ListBox.Item id="aardvark" textValue="Aardvark">
                Aardvark
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="cat" textValue="Cat">
                Cat
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="dog" textValue="Dog">
                Dog
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
      ))}
    </div>
  );
}

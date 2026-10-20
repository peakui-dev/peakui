"use client";

import {ComboBox, Input, Label, ListBox} from "@peakui/react";
import React from "react";

export function Controlled() {
  const [selectedKey, setSelectedKey] = React.useState<string | number | null>("dog");

  return (
    <div className="flex flex-col gap-2">
      <ComboBox className="w-[256px]" selectedKey={selectedKey} onSelectionChange={setSelectedKey}>
        <Label>Favorite Animal</Label>
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
            <ListBox.Item id="kangaroo" textValue="Kangaroo">
              Kangaroo
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>
      <p className="text-sm text-muted">Selected: {selectedKey ?? "None"}</p>
    </div>
  );
}

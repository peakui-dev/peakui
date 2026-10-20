"use client";

import {ComboBox, Input, Label, ListBox} from "@peakui/react";
import React from "react";

export function MultipleSelectionControlled() {
  const [value, setValue] = React.useState<(string | number)[]>(["cat", "dog"]);

  return (
    <div className="flex flex-col gap-2">
      <ComboBox
        className="w-[256px]"
        selectionMode="multiple"
        value={value}
        onChange={(keys) => setValue(keys as (string | number)[])}
      >
        <Label>Favorite Animals</Label>
        <ComboBox.InputGroup>
          <Input placeholder="Search animals..." />
          <ComboBox.Trigger />
        </ComboBox.InputGroup>
        <ComboBox.Value placeholder="No animals selected" />
        <ComboBox.Popover>
          <ListBox selectionMode="multiple">
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
      <p className="text-sm text-muted">Selected: {value.join(", ") || "None"}</p>
    </div>
  );
}

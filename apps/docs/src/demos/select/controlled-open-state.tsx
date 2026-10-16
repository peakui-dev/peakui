"use client";

import {Button, Label, ListBox, Select} from "@peakui/react";
import React from "react";

export function ControlledOpenState() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <Select
        className="w-[256px]"
        isOpen={isOpen}
        placeholder="Select one"
        onOpenChange={setIsOpen}
      >
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="delaware" textValue="Delaware">
              Delaware
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      <Button onPress={() => setIsOpen(!isOpen)}>{isOpen ? "Close" : "Open"} Select</Button>
      <p className="text-sm text-muted">Select is {isOpen ? "open" : "closed"}</p>
    </div>
  );
}

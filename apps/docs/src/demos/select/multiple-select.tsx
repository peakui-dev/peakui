import {Label, ListBox, Select} from "@peakui/react";

export function MultipleSelect() {
  return (
    <Select className="w-[256px]" placeholder="Select countries" selectionMode="multiple">
      <Label>Countries to Visit</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox selectionMode="multiple">
          <ListBox.Item id="argentina" textValue="Argentina">
            Argentina
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="japan" textValue="Japan">
            Japan
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="france" textValue="France">
            France
            <ListBox.ItemIndicator />
          </ListBox.Item>
          <ListBox.Item id="iceland" textValue="Iceland">
            Iceland
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

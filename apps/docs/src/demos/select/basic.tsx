import {Label, ListBox, Select} from "@peakui/react";

export function Basic() {
  return (
    <Select className="w-[256px]" placeholder="Select one">
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
          <ListBox.Item id="texas" textValue="Texas">
            Texas
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

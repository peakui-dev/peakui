import {Label, ListBox, Select} from "@peakui/react";

export function CustomStyles() {
  return (
    <Select className="w-[256px]" placeholder="Select one">
      <Label>State</Label>
      <Select.Trigger className="rounded-lg border-border/80 bg-surface data-[hovered=true]:bg-surface-hover">
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover className="rounded-xl border border-border/80 bg-surface p-1 shadow-sm">
        <ListBox>
          <ListBox.Item
            className="rounded-lg data-[focused=true]:bg-default"
            id="rename"
            textValue="Rename"
          >
            Rename
          </ListBox.Item>
          <ListBox.Item
            className="rounded-lg data-[focused=true]:bg-default"
            id="duplicate"
            textValue="Duplicate"
          >
            Duplicate
          </ListBox.Item>
          <ListBox.Item
            className="rounded-lg data-[focused=true]:bg-danger-soft"
            id="delete"
            textValue="Delete"
            variant="danger"
          >
            Delete
          </ListBox.Item>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

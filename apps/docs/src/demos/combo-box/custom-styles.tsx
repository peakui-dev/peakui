import {ComboBox, Input, Label, ListBox} from "@peakui/react";

export function CustomStyles() {
  return (
    <ComboBox className="w-[256px]">
      <Label>Favorite Animal</Label>
      <ComboBox.InputGroup>
        <Input className="rounded-lg" placeholder="Search animals..." />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover className="rounded-xl border border-border/80 bg-surface p-1 shadow-sm">
        <ListBox>
          <ListBox.Item
            className="rounded-lg data-[focused=true]:bg-default"
            id="cat"
            textValue="Cat"
          >
            Cat
          </ListBox.Item>
          <ListBox.Item
            className="rounded-lg data-[focused=true]:bg-default"
            id="dog"
            textValue="Dog"
          >
            Dog
          </ListBox.Item>
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

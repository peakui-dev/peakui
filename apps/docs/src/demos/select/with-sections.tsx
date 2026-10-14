import {Label, ListBox, Select, Separator} from "@peakui/react";

export function WithSections() {
  return (
    <Select className="w-[256px]" placeholder="Select a country">
      <Label>Country</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {/* A visible section heading needs a Header part; until one ships, aria-label names the group. */}
          <ListBox.Section aria-label="North America">
            <ListBox.Item id="usa" textValue="United States">
              United States
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="canada" textValue="Canada">
              Canada
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox.Section>
          <Separator />
          <ListBox.Section aria-label="Europe">
            <ListBox.Item id="uk" textValue="United Kingdom">
              United Kingdom
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="germany" textValue="Germany">
              Germany
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox.Section>
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

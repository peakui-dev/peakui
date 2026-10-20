import {ComboBox, Input, Label, ListBox, Separator} from "@peakui/react";

export function WithSections() {
  return (
    <ComboBox className="w-[256px]">
      <Label>Country</Label>
      <ComboBox.InputGroup>
        <Input placeholder="Search countries..." />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
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
            <ListBox.Item id="france" textValue="France">
              France
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox.Section>
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

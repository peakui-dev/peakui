import {Autocomplete, EmptyState, Label, ListBox, SearchField, Separator} from "@peakui/react";

export function WithSections() {
  return (
    <Autocomplete className="w-[256px]" placeholder="Select a country">
      <Label>Country</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter>
          <SearchField autoFocus aria-label="Search countries" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search countries..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
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
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}

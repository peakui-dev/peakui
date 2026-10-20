import {Autocomplete, EmptyState, Label, ListBox, SearchField} from "@peakui/react";

export function Disabled() {
  return (
    <Autocomplete
      isDisabled
      className="w-[256px]"
      defaultValue="cat"
      placeholder="Select an animal"
    >
      <Label>Favorite Animal</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter>
          <SearchField autoFocus aria-label="Search animals" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search animals..." />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
            <ListBox.Item id="cat" textValue="Cat">
              Cat
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="dog" textValue="Dog">
              Dog
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="elephant" textValue="Elephant">
              Elephant
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="lion" textValue="Lion">
              Lion
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}

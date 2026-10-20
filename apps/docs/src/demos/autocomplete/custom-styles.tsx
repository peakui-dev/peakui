import {Autocomplete, EmptyState, Label, ListBox, SearchField} from "@peakui/react";

export function CustomStyles() {
  return (
    <Autocomplete className="w-[256px]" placeholder="Select a state">
      <Label>State</Label>
      <Autocomplete.Trigger className="rounded-lg border-border/80 bg-surface data-[hovered=true]:bg-surface-hover">
        <Autocomplete.Value />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover className="rounded-xl border border-border/80 bg-surface shadow-sm">
        <Autocomplete.Filter>
          <SearchField autoFocus aria-label="Search states" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search states..." />
            </SearchField.Group>
          </SearchField>
          <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
            <ListBox.Item
              className="rounded-lg data-[focused=true]:bg-default"
              id="california"
              textValue="California"
            >
              California
            </ListBox.Item>
            <ListBox.Item
              className="rounded-lg data-[focused=true]:bg-default"
              id="texas"
              textValue="Texas"
            >
              Texas
            </ListBox.Item>
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}

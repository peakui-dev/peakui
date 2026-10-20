"use client";

import {Autocomplete, Button, EmptyState, Label, ListBox, SearchField} from "@peakui/react";
import {useState} from "react";

export function ControlledOpenState() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-3">
      <Button variant="secondary" onPress={() => setIsOpen((open) => !open)}>
        {isOpen ? "Close" : "Open"}
      </Button>
      <Autocomplete
        className="w-[256px]"
        isOpen={isOpen}
        placeholder="Select a state"
        onOpenChange={setIsOpen}
      >
        <Label>State</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter>
            <SearchField autoFocus aria-label="Search states" variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Search states..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
              <ListBox.Item id="california" textValue="California">
                California
                <ListBox.ItemIndicator />
              </ListBox.Item>
              <ListBox.Item id="texas" textValue="Texas">
                Texas
                <ListBox.ItemIndicator />
              </ListBox.Item>
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
    </div>
  );
}

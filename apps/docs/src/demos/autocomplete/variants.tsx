"use client";

import {Autocomplete, Label, ListBox, SearchField} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-6">
      {(["primary", "secondary"] as const).map((variant) => (
        <Autocomplete
          key={variant}
          className="w-[256px]"
          placeholder="Select a state"
          variant={variant}
        >
          <Label className="capitalize">{variant}</Label>
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
                </SearchField.Group>
              </SearchField>
              <ListBox>
                <ListBox.Item id="california" textValue="California">
                  California
                </ListBox.Item>
                <ListBox.Item id="texas" textValue="Texas">
                  Texas
                </ListBox.Item>
              </ListBox>
            </Autocomplete.Filter>
          </Autocomplete.Popover>
        </Autocomplete>
      ))}
    </div>
  );
}

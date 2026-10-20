"use client";

import {Autocomplete, EmptyState, Label, ListBox, SearchField, Tag, TagGroup} from "@peakui/react";
import {useState} from "react";

const STATES = [
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "florida", name: "Florida"},
  {id: "new-york", name: "New York"},
];

export function MultipleSelect() {
  const [value, setValue] = useState<(string | number)[]>([]);

  return (
    <Autocomplete
      className="w-[256px]"
      placeholder="Select states"
      selectionMode="multiple"
      value={value}
      onChange={(keys) => setValue(keys as (string | number)[])}
    >
      <Label>States</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value>
          {({defaultChildren, isPlaceholder, state}) =>
            isPlaceholder || state.selectedItems.length === 0 ? (
              defaultChildren
            ) : (
              <TagGroup
                aria-label="Selected states"
                size="sm"
                onRemove={(keys) => setValue((prev) => prev.filter((key) => !keys.has(key)))}
              >
                <TagGroup.List>
                  {state.selectedItems.map((selected) => (
                    <Tag key={selected.key} id={selected.key}>
                      {STATES.find((s) => s.id === selected.key)?.name}
                    </Tag>
                  ))}
                </TagGroup.List>
              </TagGroup>
            )
          }
        </Autocomplete.Value>
        <Autocomplete.ClearButton />
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
            {STATES.map((state) => (
              <ListBox.Item key={state.id} id={state.id} textValue={state.name}>
                {state.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}

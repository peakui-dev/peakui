"use client";

import {
  Autocomplete,
  Button,
  EmptyState,
  FieldError,
  Form,
  Label,
  ListBox,
  SearchField,
} from "@peakui/react";

export function Required() {
  return (
    <Form className="flex w-[256px] flex-col gap-4">
      <Autocomplete isRequired className="w-full" name="state" placeholder="Select one">
        <Label>State</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
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
        <FieldError />
      </Autocomplete>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

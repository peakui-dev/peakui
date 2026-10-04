import {Description, Label, SearchField} from "@peakui/react";

export function WithDescription() {
  return (
    <SearchField name="search">
      <Label>Search products</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input className="w-[280px]" placeholder="Search products..." />
        <SearchField.ClearButton />
      </SearchField.Group>
      <Description>Enter keywords to search for products</Description>
    </SearchField>
  );
}

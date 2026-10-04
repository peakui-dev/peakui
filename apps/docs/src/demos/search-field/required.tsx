import {Description, Label, SearchField} from "@peakui/react";

export function Required() {
  return (
    <SearchField isRequired name="search-query">
      <Label>Search query</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input className="w-[280px]" placeholder="Enter search query..." />
        <SearchField.ClearButton />
      </SearchField.Group>
      <Description>Minimum 3 characters required</Description>
    </SearchField>
  );
}

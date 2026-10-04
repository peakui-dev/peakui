import {FieldError, Label, SearchField} from "@peakui/react";

export function Validation() {
  return (
    <SearchField isInvalid isRequired name="search" value="ab">
      <Label>Search</Label>
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input className="w-[280px]" placeholder="Search..." />
        <SearchField.ClearButton />
      </SearchField.Group>
      <FieldError>Search query must be at least 3 characters</FieldError>
    </SearchField>
  );
}

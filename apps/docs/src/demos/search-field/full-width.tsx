import {Label, SearchField} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="w-[400px]">
      <SearchField fullWidth name="search">
        <Label>Search</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder="Search..." />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>
    </div>
  );
}

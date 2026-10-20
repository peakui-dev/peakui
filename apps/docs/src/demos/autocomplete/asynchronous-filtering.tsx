"use client";

import {Autocomplete, EmptyState, Label, ListBox, SearchField, Spinner} from "@peakui/react";
import {useEffect, useState} from "react";

const ANIMALS = ["Cat", "Dog", "Elephant", "Lion", "Tiger", "Giraffe"];

// A timer stands in for the request: the consumer owns loading and filtering.
export function AsynchronousFiltering() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState(ANIMALS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setItems(ANIMALS.filter((name) => name.toLowerCase().includes(query.toLowerCase())));
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Autocomplete allowsEmptyCollection className="w-[256px]" placeholder="Search...">
      <Label>Animal</Label>
      <Autocomplete.Trigger>
        <Autocomplete.Value />
        <Autocomplete.ClearButton />
        <Autocomplete.Indicator />
      </Autocomplete.Trigger>
      <Autocomplete.Popover>
        <Autocomplete.Filter
          filter={() => true}
          inputValue={query}
          onInputChange={(next) => {
            setQuery(next);
            setIsLoading(true);
          }}
        >
          <SearchField autoFocus aria-label="Search animals" variant="secondary">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search animals..." />
              {isLoading ? <Spinner className="me-2" size="sm" /> : null}
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <ListBox
            items={items.map((name) => ({id: name, name}))}
            renderEmptyState={() => <EmptyState>No results found</EmptyState>}
          >
            {(item) => (
              <ListBox.Item id={item.id} textValue={item.name}>
                {item.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </Autocomplete.Filter>
      </Autocomplete.Popover>
    </Autocomplete>
  );
}

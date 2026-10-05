"use client";

import type {FormEvent} from "react";

import {Button, Description, FieldError, Form, Label, SearchField, Spinner} from "@peakui/react";
import {useState} from "react";

const MIN_LENGTH = 3;

export function FormExample() {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInvalid = value.length > 0 && value.length < MIN_LENGTH;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (value.length < MIN_LENGTH) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setValue("");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Form className="flex w-[280px] flex-col gap-4" onSubmit={handleSubmit}>
      <SearchField isRequired isInvalid={isInvalid} name="search" value={value} onChange={setValue}>
        <Label>Search products</Label>
        <SearchField.Group>
          <SearchField.SearchIcon />
          <SearchField.Input className="w-full" placeholder="Search products..." />
          <SearchField.ClearButton />
        </SearchField.Group>
        {isInvalid ? (
          <FieldError>Search query must be at least {MIN_LENGTH} characters</FieldError>
        ) : (
          <Description>Enter at least {MIN_LENGTH} characters to search</Description>
        )}
      </SearchField>
      <Button
        className="w-full"
        isDisabled={value.length < MIN_LENGTH}
        isPending={isSubmitting}
        type="submit"
        variant="primary"
      >
        {isSubmitting ? (
          <>
            <Spinner color="current" size="sm" />
            Searching...
          </>
        ) : (
          "Search"
        )}
      </Button>
    </Form>
  );
}

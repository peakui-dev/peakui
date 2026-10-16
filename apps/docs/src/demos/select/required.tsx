"use client";

import {Button, FieldError, Form, Label, ListBox, Select} from "@peakui/react";

export function Required() {
  return (
    <Form
      className="flex w-[256px] flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        alert("Form submitted successfully!");
      }}
    >
      <Select isRequired className="w-full" name="state" placeholder="Select one">
        <Label>State</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item id="florida" textValue="Florida">
              Florida
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="california" textValue="California">
              California
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item id="texas" textValue="Texas">
              Texas
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
        <FieldError />
      </Select>
      <Button type="submit">Submit</Button>
    </Form>
  );
}

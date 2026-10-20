"use client";

import {Calendar, ChevronDown} from "@gravity-ui/icons";
import {DateField, Label} from "@peakui/react";

export function WithPrefixAndSuffix() {
  return (
    <DateField className="w-64" name="date">
      <Label>Date</Label>
      <DateField.Group>
        <DateField.Prefix>
          <Calendar className="size-4" />
        </DateField.Prefix>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        <DateField.Suffix>
          <ChevronDown className="size-4" />
        </DateField.Suffix>
      </DateField.Group>
    </DateField>
  );
}

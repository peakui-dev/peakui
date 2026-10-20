"use client";

import {Clock} from "@gravity-ui/icons";
import {Label, TimeField} from "@peakui/react";

export function WithPrefixAndSuffix() {
  return (
    <TimeField className="w-64" name="time">
      <Label>Time</Label>
      <TimeField.Group>
        <TimeField.Prefix>
          <Clock className="size-4" />
        </TimeField.Prefix>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        <TimeField.Suffix>UTC</TimeField.Suffix>
      </TimeField.Group>
    </TimeField>
  );
}

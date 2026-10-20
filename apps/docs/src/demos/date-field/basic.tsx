import {DateField, Label} from "@peakui/react";

export function Basic() {
  return (
    <DateField className="w-64" name="date">
      <Label>Date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
    </DateField>
  );
}

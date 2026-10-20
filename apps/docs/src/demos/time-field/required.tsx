import {Description, Label, TimeField} from "@peakui/react";

export function Required() {
  return (
    <TimeField isRequired className="w-64" name="time">
      <Label>Start time</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      <Description>Required field</Description>
    </TimeField>
  );
}

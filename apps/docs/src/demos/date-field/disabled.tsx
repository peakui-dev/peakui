import {parseDate} from "@internationalized/date";
import {DateField, Description, Label} from "@peakui/react";

export function Disabled() {
  return (
    <DateField isDisabled className="w-64" defaultValue={parseDate("2026-08-15")} name="date">
      <Label>Date</Label>
      <DateField.Group>
        <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
      </DateField.Group>
      <Description>This date field is disabled</Description>
    </DateField>
  );
}

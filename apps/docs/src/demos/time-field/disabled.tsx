import {Time} from "@internationalized/date";
import {Description, Label, TimeField} from "@peakui/react";

export function Disabled() {
  return (
    <TimeField isDisabled className="w-64" defaultValue={new Time(9, 30)} name="time">
      <Label>Time</Label>
      <TimeField.Group>
        <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
      </TimeField.Group>
      <Description>This time field is disabled</Description>
    </TimeField>
  );
}

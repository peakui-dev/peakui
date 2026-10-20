import {Time} from "@internationalized/date";
import {Label, TimeField} from "@peakui/react";

export function HourCycle() {
  return (
    <div className="flex flex-col gap-4">
      <TimeField className="w-64" defaultValue={new Time(15, 30)} hourCycle={12} name="time-12">
        <Label>12-hour clock</Label>
        <TimeField.Group>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
      <TimeField className="w-64" defaultValue={new Time(15, 30)} hourCycle={24} name="time-24">
        <Label>24-hour clock</Label>
        <TimeField.Group>
          <TimeField.Input>{(segment) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
      </TimeField>
    </div>
  );
}

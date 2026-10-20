import {DateField, Label} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-4">
      <DateField className="w-64" name="primary-date">
        <Label>Primary</Label>
        <DateField.Group variant="primary">
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
      </DateField>
      <DateField className="w-64" name="secondary-date">
        <Label>Secondary</Label>
        <DateField.Group variant="secondary">
          <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
      </DateField>
    </div>
  );
}

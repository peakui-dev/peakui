import {Description, Label, NumberField} from "@peakui/react";

export function WithStep() {
  return (
    <NumberField defaultValue={0} maxValue={100} minValue={0} name="step5" step={5}>
      <Label>Step: 5</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input className="w-[120px]" />
        <NumberField.IncrementButton />
      </NumberField.Group>
      <Description>Increments by 5</Description>
    </NumberField>
  );
}

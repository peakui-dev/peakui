import {Description, Label, NumberField} from "@peakui/react";

export function WithFormatOptions() {
  return (
    <NumberField
      defaultValue={99}
      formatOptions={{style: "currency", currency: "USD"}}
      minValue={0}
      name="price"
    >
      <Label>Price</Label>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input className="w-[120px]" />
        <NumberField.IncrementButton />
      </NumberField.Group>
      <Description>Currency through formatOptions</Description>
    </NumberField>
  );
}

import {Fieldset, Input, Label, TextField} from "@peakui/react";

export function AddressForm() {
  return (
    <Fieldset className="max-w-md">
      <Fieldset.Legend>Shipping</Fieldset.Legend>
      <Fieldset.Group>
        <TextField name="street">
          <Label>Street</Label>
          <Input />
        </TextField>
        <TextField name="city">
          <Label>City</Label>
          <Input />
        </TextField>
      </Fieldset.Group>
    </Fieldset>
  );
}

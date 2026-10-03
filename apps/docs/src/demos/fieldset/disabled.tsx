import {Button, Fieldset, Input, Label, TextField} from "@peakui/react";

export function Disabled() {
  return (
    <Fieldset disabled className="w-full max-w-sm">
      <Fieldset.Legend>Billing address</Fieldset.Legend>
      <Fieldset.Group>
        <TextField fullWidth name="city">
          <Label>City</Label>
          <Input defaultValue="Vienna" />
        </TextField>
      </Fieldset.Group>
      <Fieldset.Actions>
        <Button>Save</Button>
      </Fieldset.Actions>
    </Fieldset>
  );
}

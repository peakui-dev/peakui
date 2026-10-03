import {Button, Description, Fieldset, Input, Label, TextField} from "@peakui/react";

export function Basic() {
  return (
    <Fieldset className="w-full max-w-sm">
      <Fieldset.Legend>Profile</Fieldset.Legend>
      <Fieldset.Group>
        <TextField fullWidth isRequired name="name">
          <Label>Name</Label>
          <Input placeholder="Jane Doe" />
        </TextField>
        <TextField fullWidth name="email" type="email">
          <Label>Email</Label>
          <Input placeholder="jane@example.com" />
          <Description>Used for account notifications only.</Description>
        </TextField>
      </Fieldset.Group>
      <Fieldset.Actions>
        <Button>Save</Button>
        <Button variant="ghost">Cancel</Button>
      </Fieldset.Actions>
    </Fieldset>
  );
}

import {Button, Description, FieldError, Form, Input, Label, TextField} from "@peakui/react";

export function Basic() {
  return (
    <Form aria-label="Profile" className="flex flex-col gap-4">
      <TextField isRequired name="name">
        <Label>Name</Label>
        <Input />
        <FieldError />
      </TextField>
      <TextField isRequired name="email">
        <Label>Email</Label>
        <Input type="email" />
        <Description>We never share it</Description>
        <FieldError />
      </TextField>
      <Button type="submit">Save</Button>
    </Form>
  );
}

import {Button, FieldError, Input, Label, TextField} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4" onSubmit={(event) => event.preventDefault()}>
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input />
        <FieldError />
      </TextField>
      <TextField isRequired minLength={8} name="password" type="password">
        <Label>Password</Label>
        <Input />
        <FieldError />
      </TextField>
      <Button type="submit">Sign in</Button>
    </form>
  );
}

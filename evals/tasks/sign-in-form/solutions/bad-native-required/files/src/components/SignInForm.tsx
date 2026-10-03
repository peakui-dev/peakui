import {Button, Input, Label, TextField} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4">
      <TextField name="email" type="email">
        <Label>Email</Label>
        <Input required />
      </TextField>
      <TextField name="password" type="password">
        <Label>Password</Label>
        <Input required minLength={8} />
      </TextField>
      <Button type="submit">Sign in</Button>
    </form>
  );
}

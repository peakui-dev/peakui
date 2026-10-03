import {Button, Input} from "@peakui/react";

export function SignInForm() {
  return (
    <form className="flex w-80 flex-col gap-4">
      <Input label="Email" errorMessage="Enter your email" isRequired name="email" type="email" />
      <Input
        label="Password"
        errorMessage="At least 8 characters"
        isRequired
        minLength={8}
        name="password"
        type="password"
      />
      <Button type="submit">Sign in</Button>
    </form>
  );
}

"use client"; // the demo passes an onSubmit handler

import {Button, Card, Input, Label, TextField} from "@peakui/react";

export function WithForm() {
  return (
    <Card className="w-full max-w-sm">
      <Card.Header>
        <Card.Title>Login</Card.Title>
        <Card.Description>Enter your credentials to access your account</Card.Description>
      </Card.Header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Card.Content>
          <div className="flex flex-col gap-4">
            <TextField name="email" type="email">
              <Label>Email</Label>
              <Input placeholder="email@example.com" variant="secondary" />
            </TextField>
            <TextField name="password" type="password">
              <Label>Password</Label>
              <Input placeholder="••••••••" variant="secondary" />
            </TextField>
          </div>
        </Card.Content>
        <Card.Footer className="mt-4 flex flex-col gap-2">
          <Button className="w-full" type="submit">
            Sign In
          </Button>
        </Card.Footer>
      </form>
    </Card>
  );
}

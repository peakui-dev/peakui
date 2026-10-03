"use client";

import {Button, Description, FieldError, Input, Label, TextField} from "@peakui/react";
import {useState} from "react";

export function Form() {
  const [saved, setSaved] = useState<string | null>(null);

  return (
    <form
      className="flex w-72 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);

        setSaved(String(data.get("email")));
      }}
    >
      <TextField
        isRequired
        minLength={3}
        name="username"
        validate={(value) => (value.includes(" ") ? "A username cannot contain spaces." : null)}
      >
        <Label>Username</Label>
        <Input placeholder="jane" />
        <Description>At least 3 characters, no spaces.</Description>
        <FieldError />
      </TextField>
      <TextField isRequired name="email" type="email">
        <Label>Email</Label>
        <Input placeholder="jane@example.com" />
        <Description>We send a confirmation link.</Description>
        <FieldError />
      </TextField>
      <Button type="submit">Create account</Button>
      {saved ? <p role="status">Confirmation sent to {saved}.</p> : null}
    </form>
  );
}

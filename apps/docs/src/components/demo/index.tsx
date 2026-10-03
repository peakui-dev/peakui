"use client";

import type {ReactNode} from "react";

import {Envelope, Magnifier, Plus} from "@gravity-ui/icons";
import {
  Button,
  Description,
  FieldError,
  Fieldset,
  Input,
  InputGroup,
  Label,
  Spinner,
  TextField,
} from "@peakui/react";
import {useState} from "react";

function DemoCard({children, className}: {children: ReactNode; className?: string}) {
  return (
    <div
      className={`flex w-full max-w-[360px] flex-col gap-4 rounded-3xl bg-surface p-5 text-start shadow-surface ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

function ButtonsDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button>
        <Plus />
        New project
      </Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="tertiary">Tertiary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger-soft">Delete</Button>
    </div>
  );
}

function TextFieldDemo() {
  const [value, setValue] = useState("jane@");
  const isInvalid = value.length > 0 && !/^\S+@\S+\.\S+$/.test(value);

  return (
    <DemoCard>
      <TextField
        fullWidth
        isInvalid={isInvalid}
        name="email"
        type="email"
        value={value}
        variant="secondary"
        onChange={setValue}
      >
        <Label>Your email</Label>
        <Input placeholder="jane@example.com" />
        <Description>We won&apos;t share your email.</Description>
        <FieldError>Enter a complete email address.</FieldError>
      </TextField>
    </DemoCard>
  );
}

function SearchDemo() {
  return (
    <InputGroup fullWidth className="max-w-[360px]">
      <InputGroup.Prefix>
        <Magnifier />
      </InputGroup.Prefix>
      <InputGroup.Input aria-label="Search components" placeholder="Search components" />
      <InputGroup.Suffix>
        <Button size="sm" variant="ghost">
          Search
        </Button>
      </InputGroup.Suffix>
    </InputGroup>
  );
}

function SpinnersDemo() {
  return (
    <div className="flex items-center justify-center gap-6">
      <Spinner aria-label="Loading, small" size="sm" />
      <Spinner aria-label="Loading, medium" color="success" size="md" />
      <Spinner aria-label="Loading, large" color="warning" size="lg" />
      <Spinner aria-label="Loading, extra large" color="danger" size="xl" />
    </div>
  );
}

function PendingDemo() {
  const [isPending, setIsPending] = useState(false);

  return (
    <Button
      fullWidth
      className="max-w-[360px]"
      isPending={isPending}
      variant="secondary"
      onPress={() => {
        setIsPending(true);
        setTimeout(() => setIsPending(false), 2000);
      }}
    >
      {isPending ? <Spinner aria-hidden color="current" size="sm" /> : <Envelope />}
      {isPending ? "Sending" : "Send invite"}
    </Button>
  );
}

function SignUpDemo() {
  return (
    <DemoCard>
      <form
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Fieldset>
          <Fieldset.Legend>Create an account</Fieldset.Legend>
          <Fieldset.Group>
            <TextField fullWidth isRequired name="name" variant="secondary">
              <Label>Name</Label>
              <Input placeholder="Jane Doe" />
              <FieldError />
            </TextField>
            <TextField fullWidth isRequired name="email" type="email" variant="secondary">
              <Label>Email</Label>
              <Input placeholder="jane@example.com" />
              <FieldError />
            </TextField>
            <TextField
              fullWidth
              isRequired
              minLength={8}
              name="password"
              type="password"
              variant="secondary"
            >
              <Label>Password</Label>
              <Input placeholder="At least 8 characters" />
              <Description>Use 8 or more characters.</Description>
              <FieldError />
            </TextField>
          </Fieldset.Group>
          <Fieldset.Actions>
            <Button type="submit">Sign up</Button>
            <Button type="reset" variant="ghost">
              Reset
            </Button>
          </Fieldset.Actions>
        </Fieldset>
      </form>
    </DemoCard>
  );
}

function ProfileDemo() {
  return (
    <DemoCard>
      <TextField fullWidth name="handle" variant="secondary">
        <Label>Profile link</Label>
        <InputGroup fullWidth>
          <InputGroup.Prefix>peakui.dev/</InputGroup.Prefix>
          <InputGroup.Input placeholder="jane" />
        </InputGroup>
        <Description>Letters, numbers and dashes.</Description>
      </TextField>
      <TextField fullWidth name="bio" variant="secondary">
        <Label>Bio</Label>
        <InputGroup fullWidth>
          <InputGroup.TextArea placeholder="A few words about you" rows={3} />
        </InputGroup>
      </TextField>
    </DemoCard>
  );
}

/** The home page's component wall: every PeakUI component, live. */
export function DemoComponents() {
  return (
    <div className="mx-auto grid w-fit grid-cols-1 gap-8 px-4 md:grid-cols-2 lg:grid-cols-[auto_auto_auto]">
      <div className="order-2 flex max-w-[360px] flex-col items-center gap-10 md:order-1">
        <TextFieldDemo />
        <SearchDemo />
        <SpinnersDemo />
      </div>
      <div className="order-1 flex max-w-[360px] flex-col items-center gap-10 md:order-2">
        <ButtonsDemo />
        <ProfileDemo />
        <PendingDemo />
      </div>
      <div className="order-3 col-span-1 flex justify-center md:col-span-2 lg:col-span-1 lg:max-w-[360px]">
        <SignUpDemo />
      </div>
    </div>
  );
}

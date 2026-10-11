"use client";

import {Button, Form, InputOtp, Label, Spinner} from "@peakui/react";
import React from "react";

export function OnComplete() {
  const [value, setValue] = React.useState("");
  const [isComplete, setIsComplete] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleComplete = (code: string) => {
    setIsComplete(true);
    console.log("Code complete:", code);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setValue("");
      setIsComplete(false);
    }, 2000);
  };

  return (
    <Form className="flex w-[280px] flex-col gap-2" onSubmit={handleSubmit}>
      <Label>Verify account</Label>
      <InputOtp
        maxLength={6}
        value={value}
        onComplete={handleComplete}
        onChange={(val) => {
          setValue(val);
          setIsComplete(false);
        }}
      >
        <InputOtp.Group>
          <InputOtp.Slot index={0} />
          <InputOtp.Slot index={1} />
          <InputOtp.Slot index={2} />
        </InputOtp.Group>
        <InputOtp.Separator />
        <InputOtp.Group>
          <InputOtp.Slot index={3} />
          <InputOtp.Slot index={4} />
          <InputOtp.Slot index={5} />
        </InputOtp.Group>
      </InputOtp>
      <Button
        className="mt-2 w-full"
        isDisabled={!isComplete}
        isPending={isSubmitting}
        type="submit"
        variant="primary"
      >
        {isSubmitting ? (
          <>
            <Spinner color="current" size="sm" />
            Verifying...
          </>
        ) : (
          "Verify Code"
        )}
      </Button>
    </Form>
  );
}

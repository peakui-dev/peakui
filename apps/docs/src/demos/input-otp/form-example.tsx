"use client";

import {Button, Description, Form, InputOtp, Label, Link, Spinner} from "@peakui/react";
import React from "react";

export function FormExample() {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (value.length !== 6) {
      setError("Please enter all 6 digits");

      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      if (value === "123456") {
        console.log("Code verified successfully!");
        setValue("");
      } else {
        setError("Invalid code. Please try again.");
      }
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Form className="flex w-[280px] flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label>Two-factor authentication</Label>
        <Description>Enter the 6-digit code from your authenticator app</Description>
        <InputOtp
          isInvalid={!!error}
          maxLength={6}
          value={value}
          onChange={(val) => {
            setValue(val);
            setError("");
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
        <span className="field-error" data-visible={!!error} id="code-error">
          {error}
        </span>
      </div>
      <Button
        className="w-full"
        isDisabled={value.length !== 6}
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
          "Verify"
        )}
      </Button>
      <div className="flex items-center justify-center gap-1">
        <p className="text-sm text-muted">Having trouble?</p>
        <Link className="text-sm text-foreground" href="#">
          Use backup code
        </Link>
      </div>
    </Form>
  );
}

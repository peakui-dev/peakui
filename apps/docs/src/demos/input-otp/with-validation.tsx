"use client";

import {Button, Description, Form, InputOtp, Label} from "@peakui/react";
import React from "react";

export function WithValidation() {
  const [value, setValue] = React.useState("");
  const [isInvalid, setIsInvalid] = React.useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const code = formData.get("code");

    if (code !== "123456") {
      setIsInvalid(true);

      return;
    }

    setIsInvalid(false);
    setValue("");
  };

  const handleChange = (val: string) => {
    setValue(val);
    setIsInvalid(false);
  };

  return (
    <div className="flex w-[280px] flex-col gap-2">
      <Form className="flex flex-col gap-2" onSubmit={onSubmit}>
        <Label>Verify account</Label>
        <Description>Hint: The code is 123456</Description>
        <InputOtp
          aria-describedby={isInvalid ? "code-error" : undefined}
          isInvalid={isInvalid}
          maxLength={6}
          name="code"
          value={value}
          onChange={handleChange}
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
        <span className="field-error" data-visible={isInvalid} id="code-error">
          Invalid code. Please try again.
        </span>
        <Button isDisabled={value.length !== 6} type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}

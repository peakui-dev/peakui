"use client";

import {Description, InputOtp, Label} from "@peakui/react";
import React from "react";

export function Controlled() {
  const [value, setValue] = React.useState("");

  return (
    <div className="flex w-[280px] flex-col gap-2">
      <Label>Verify account</Label>
      <InputOtp maxLength={6} value={value} onChange={setValue}>
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
      <Description>
        {value.length > 0 ? (
          <>
            Value: {value} ({value.length}/6) •{" "}
            <button className="font-medium text-foreground underline" onClick={() => setValue("")}>
              Clear
            </button>
          </>
        ) : (
          "Enter a 6-digit code"
        )}
      </Description>
    </div>
  );
}

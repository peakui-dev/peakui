import {Description, InputOtp, Label, REGEXP_ONLY_CHARS} from "@peakui/react";

export function WithPattern() {
  return (
    <div className="flex w-[280px] flex-col gap-2">
      <Label>Enter code (letters only)</Label>
      <Description>Only alphabetic characters are allowed</Description>
      <InputOtp maxLength={6} pattern={REGEXP_ONLY_CHARS}>
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
    </div>
  );
}

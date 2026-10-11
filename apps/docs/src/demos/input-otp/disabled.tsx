import {Description, InputOtp, Label} from "@peakui/react";

export function Disabled() {
  return (
    <div className="flex w-[280px] flex-col gap-2">
      <Label isDisabled>Verify account</Label>
      <Description>Code verification is currently disabled</Description>
      <InputOtp isDisabled maxLength={6}>
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

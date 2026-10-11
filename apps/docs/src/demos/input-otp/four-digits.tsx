import {InputOtp, Label} from "@peakui/react";

export function FourDigits() {
  return (
    <div className="flex w-[280px] flex-col gap-2">
      <Label>Enter PIN</Label>
      <InputOtp maxLength={4}>
        <InputOtp.Group>
          <InputOtp.Slot index={0} />
          <InputOtp.Slot index={1} />
          <InputOtp.Slot index={2} />
          <InputOtp.Slot index={3} />
        </InputOtp.Group>
      </InputOtp>
    </div>
  );
}

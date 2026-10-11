import {InputOtp, Label} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label>Primary variant</Label>
        <InputOtp maxLength={6} variant="primary">
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
      <div className="flex flex-col gap-2">
        <Label>Secondary variant</Label>
        <InputOtp maxLength={6} variant="secondary">
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
    </div>
  );
}

import {InputOtp, Label, Link, Surface} from "@peakui/react";

export function OnSurface() {
  return (
    <Surface className="flex w-full flex-col gap-2 rounded-3xl p-6">
      <div className="flex flex-col gap-1">
        <Label>Verify account</Label>
        <p className="text-sm text-muted">We&apos;ve sent a code to a****@gmail.com</p>
      </div>
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
      <div className="flex items-center gap-[5px] px-1 pt-1">
        <p className="text-sm text-muted">Didn&apos;t receive a code?</p>
        <Link className="text-foreground" href="#">
          Resend
        </Link>
      </div>
    </Surface>
  );
}

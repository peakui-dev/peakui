import {InputOtp, Label, Link} from "@peakui/react";

const slotClass =
  "rounded-lg border-border/80 bg-default data-[active=true]:border-accent/40 data-[active=true]:bg-accent-soft";

export function CustomStyles() {
  return (
    <div className="flex w-72 flex-col gap-2">
      <Label>Verify account</Label>
      <InputOtp maxLength={6}>
        <InputOtp.Group>
          <InputOtp.Slot className={slotClass} index={0} />
          <InputOtp.Slot className={slotClass} index={1} />
          <InputOtp.Slot className={slotClass} index={2} />
        </InputOtp.Group>
        <InputOtp.Separator className="bg-border" />
        <InputOtp.Group>
          <InputOtp.Slot className={slotClass} index={3} />
          <InputOtp.Slot className={slotClass} index={4} />
          <InputOtp.Slot className={slotClass} index={5} />
        </InputOtp.Group>
      </InputOtp>
      <Link className="text-sm text-link" href="#">
        Resend code
      </Link>
    </div>
  );
}

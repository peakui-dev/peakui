import {ssrSmoke} from "@peakui/testing/helpers";

import {InputOtp} from "@/components/input-otp/index.ts";

describe("InputOtp SSR", () => {
  it("рендерится без расхождения гидратации с группами слотов", async () => {
    const {html} = await ssrSmoke(
      <InputOtp maxLength={6}>
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
      </InputOtp>,
    );

    expect(html).toContain('data-slot="input-otp"');
    expect(html).toContain('data-slot="input-otp-slot"');
  });
});

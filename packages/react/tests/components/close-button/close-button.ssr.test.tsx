import {ssrSmoke} from "@peakui/testing/helpers";

import {CloseButton} from "@/components/close-button";

describe("CloseButton SSR", () => {
  it("renders without hydration mismatch with default props", async () => {
    const {html} = await ssrSmoke(<CloseButton />);

    expect(html).toContain('data-slot="close-button"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('data-slot="close-button-icon"');
  });

  it("renders without hydration mismatch when disabled", async () => {
    const {html} = await ssrSmoke(<CloseButton isDisabled />);

    expect(html).toContain('data-disabled="true"');
  });
});

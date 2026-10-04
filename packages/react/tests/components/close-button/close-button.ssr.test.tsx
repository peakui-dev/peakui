import {ssrSmoke} from "@peakui/testing/helpers";

import {CloseButton} from "@/components/close-button";

describe("CloseButton SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<CloseButton />);

    expect(html).toContain('data-slot="close-button"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('data-slot="close-button-icon"');
  });

  it("рендерится без расхождения гидратации в отключённом состоянии", async () => {
    const {html} = await ssrSmoke(<CloseButton isDisabled />);

    expect(html).toContain('data-disabled="true"');
  });
});

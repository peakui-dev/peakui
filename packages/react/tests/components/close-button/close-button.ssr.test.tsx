import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {CloseButton} from "@/components/close-button";

describe("CloseButton SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<CloseButton />);

    expect(html).toContain('data-slot="close-button"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('data-slot="close-button-icon"');
  });

  it("гидрируется без расхождений при ru-RU", async () => {
    const {html} = await ssrSmoke(
      <I18nProvider locale="ru-RU">
        <CloseButton />
      </I18nProvider>,
    );

    expect(html).toContain('aria-label="Закрыть"');
  });

  it("рендерится без расхождения гидратации в отключённом состоянии", async () => {
    const {html} = await ssrSmoke(<CloseButton isDisabled />);

    expect(html).toContain('data-disabled="true"');
  });
});

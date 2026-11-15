import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

import {Spinner} from "@/components/spinner";

describe("Spinner SSR", () => {
  it("renders without hydration mismatch with default props", async () => {
    const {html} = await ssrSmoke(<Spinner />);

    expect(html).toMatch(/url\(#|<linearGradient/);
  });

  it("hydrates without mismatch under ru-RU", async () => {
    const {html} = await ssrSmoke(
      <I18nProvider locale="ru-RU">
        <Spinner />
      </I18nProvider>,
    );

    expect(html).toContain('aria-label="Загрузка"');
  });

  it("renders without hydration mismatch with color and size variants", async () => {
    const {html} = await ssrSmoke(<Spinner color="danger" size="lg" />);

    expect(html).toMatch(/url\(#|<linearGradient/);
  });
});

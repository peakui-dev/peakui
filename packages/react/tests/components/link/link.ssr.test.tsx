import {ssrSmoke} from "@peakui/testing/helpers";

import {Link} from "@/components/link";

describe("Link SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<Link href="/pricing">Тарифы</Link>);

    expect(html).toContain('data-slot="link"');
    expect(html).toContain('href="/pricing"');
  });

  it("рендерится без расхождения гидратации с иконкой по умолчанию", async () => {
    const {html} = await ssrSmoke(
      <Link href="#">
        Документация
        <Link.Icon />
      </Link>,
    );

    expect(html).toContain('data-slot="link-icon"');
    expect(html).toContain('data-default-icon="true"');
    expect(html).toContain('data-slot="link-default-icon"');
  });
});

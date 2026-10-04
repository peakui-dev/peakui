import {ssrSmoke} from "@peakui/testing/helpers";

import {Separator} from "@/components/separator";

describe("Separator SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<Separator />);

    expect(html).toContain("<hr");
    expect(html).toContain('data-slot="separator"');
    expect(html).toContain("separator--horizontal");
  });

  it("рендерится без расхождения гидратации с вертикальной ориентацией", async () => {
    const {html} = await ssrSmoke(<Separator orientation="vertical" />);

    expect(html).toContain('role="separator"');
    expect(html).toContain('aria-orientation="vertical"');
    expect(html).toContain("separator--vertical");
  });
});

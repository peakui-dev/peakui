import {ssrSmoke} from "@peakui/testing/helpers";

import {Surface} from "@/components/surface";

describe("Surface SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<Surface>Контент</Surface>);

    expect(html).toContain('data-slot="surface"');
  });

  it("рендерится без расхождения гидратации с вариантом secondary", async () => {
    const {html} = await ssrSmoke(<Surface variant="secondary">Контент</Surface>);

    expect(html).toContain("surface--secondary");
  });
});

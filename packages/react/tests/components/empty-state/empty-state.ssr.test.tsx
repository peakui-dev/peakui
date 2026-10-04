import {ssrSmoke} from "@peakui/testing/helpers";

import {EmptyState} from "@/components/empty-state";

describe("EmptyState SSR", () => {
  it("рендерится без расхождения гидратации с дефолтной фразой", async () => {
    const {html} = await ssrSmoke(<EmptyState />);

    expect(html).toContain('data-slot="empty-state"');
    expect(html).toContain("No results found");
  });

  it("рендерится без расхождения гидратации с собственным содержимым", async () => {
    const {html} = await ssrSmoke(<EmptyState className="py-8">Здесь пока ничего нет</EmptyState>);

    expect(html).toContain('data-slot="empty-state"');
    expect(html).toContain("Здесь пока ничего нет");
  });
});

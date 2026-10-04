import {ssrSmoke} from "@peakui/testing/helpers";

import {Chip} from "@/components/chip";

describe("Chip SSR", () => {
  it("рендерится без расхождения гидратации с дефолтными пропсами", async () => {
    const {html} = await ssrSmoke(<Chip>Тег</Chip>);

    expect(html).toContain('data-slot="chip"');
    expect(html).toContain('data-slot="chip-label"');
  });

  it("рендерится без расхождения гидратации с вариантом и цветом", async () => {
    const {html} = await ssrSmoke(
      <Chip color="danger" size="lg" variant="soft">
        Тег
      </Chip>,
    );

    expect(html).toContain("chip--danger");
    expect(html).toContain("chip--soft");
    expect(html).toContain("chip--lg");
  });

  it("рендерится без расхождения гидратации с явной меткой", async () => {
    const {html} = await ssrSmoke(
      <Chip>
        <Chip.Label>Тег</Chip.Label>
      </Chip>,
    );

    expect(html).toContain("chip__label");
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {Kbd} from "@/components/kbd";

describe("Kbd SSR", () => {
  it("рендерится без расхождения гидратации с составными частями", async () => {
    const {html} = await ssrSmoke(
      <Kbd>
        <Kbd.Abbr keyValue="command" />
        <Kbd.Content>K</Kbd.Content>
      </Kbd>,
    );

    expect(html).toContain('data-slot="kbd"');
    expect(html).toContain('title="Command"');
  });

  it("рендерится без расхождения гидратации с вариантом light", async () => {
    const {html} = await ssrSmoke(<Kbd variant="light">Esc</Kbd>);

    expect(html).toContain("kbd--light");
  });
});

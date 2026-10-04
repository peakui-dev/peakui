import {ssrSmoke} from "@peakui/testing/helpers";

import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";

describe("TagGroup SSR", () => {
  it("рендерится без расхождения гидратации с корнем и списком", async () => {
    const {html} = await ssrSmoke(
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
          <Tag id="travel">Путешествия</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(html).toContain('data-slot="tag-group"');
    expect(html).toContain('data-slot="tag-group-list"');
  });

  it("передаёт размер и вариант тегам без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <TagGroup aria-label="Категории" selectionMode="single" size="lg" variant="surface">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(html).toContain("tag--lg");
    expect(html).toContain("tag--surface");
  });
});

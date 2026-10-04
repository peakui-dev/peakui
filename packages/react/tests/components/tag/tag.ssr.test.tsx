import {ssrSmoke} from "@peakui/testing/helpers";

import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";

describe("Tag SSR", () => {
  it("рендерится без расхождения гидратации внутри группы", async () => {
    const {html} = await ssrSmoke(
      <TagGroup aria-label="Категории" selectionMode="single">
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(html).toContain('data-slot="tag"');
    expect(html).toContain("Новости");
  });

  it("рендерит кнопку удаления без расхождения гидратации", async () => {
    const {html} = await ssrSmoke(
      <TagGroup aria-label="Категории" selectionMode="single" onRemove={() => {}}>
        <TagGroup.List>
          <Tag id="news">Новости</Tag>
        </TagGroup.List>
      </TagGroup>,
    );

    expect(html).toContain('data-slot="tag-remove-button"');
  });
});

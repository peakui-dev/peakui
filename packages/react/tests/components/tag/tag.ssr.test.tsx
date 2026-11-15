import {ssrSmoke} from "@peakui/testing/helpers";
import {I18nProvider} from "react-aria-components/I18nProvider";

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

  it("гидрируется без расхождений при ru-RU", async () => {
    const {html} = await ssrSmoke(
      <I18nProvider locale="ru-RU">
        <TagGroup aria-label="Категории" selectionMode="single" onRemove={() => {}}>
          <TagGroup.List>
            <Tag id="news">Новости</Tag>
          </TagGroup.List>
        </TagGroup>
      </I18nProvider>,
    );

    expect(html).toContain('aria-label="Удалить тег"');
  });
});

import {ssrSmoke} from "@peakui/testing/helpers";

import {ErrorMessage} from "@/components/error-message/index.ts";
import {Tag} from "@/components/tag/index.ts";
import {TagGroup} from "@/components/tag-group/index.ts";

describe("ErrorMessage SSR", () => {
  it("рендерится без расхождения гидратации внутри группы тегов", async () => {
    const {html} = await ssrSmoke(
      <TagGroup aria-label="Categories" selectionMode="multiple">
        <TagGroup.List>
          <Tag id="news">News</Tag>
          <Tag id="travel">Travel</Tag>
        </TagGroup.List>
        <ErrorMessage>Select at least one category</ErrorMessage>
      </TagGroup>,
    );

    expect(html).toContain('data-slot="error-message"');
    expect(html).toContain("Select at least one category");
  });
});

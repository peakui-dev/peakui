import {ssrSmoke} from "@peakui/testing/helpers";
import {Header} from "react-aria-components/ListBox";

import {ListBox} from "@/components/list-box/index.ts";

describe("ListBox SSR", () => {
  it("рендерится без гидратационного расхождения в полной раскладке", async () => {
    const {html} = await ssrSmoke(
      <ListBox aria-label="Users" selectionMode="single">
        <ListBox.Item id="bob" textValue="Bob">
          Bob
          <ListBox.ItemIndicator />
        </ListBox.Item>
        <ListBox.Section>
          <Header>Team</Header>
          <ListBox.Item id="fred" textValue="Fred">
            Fred
            <ListBox.ItemIndicator />
          </ListBox.Item>
        </ListBox.Section>
      </ListBox>,
    );

    expect(html).toContain('data-slot="list-box"');
    expect(html).toContain('data-slot="list-box-item"');
    expect(html).toContain('data-slot="list-box-item-indicator"');
    expect(html).toContain('data-slot="list-box-section"');
  });
});

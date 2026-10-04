import {ssrSmoke} from "@peakui/testing/helpers";
import {Header} from "react-aria-components/ListBox";

import {ListBox} from "@/components/list-box/index.ts";
import {ListBoxSection} from "@/components/list-box-section/index.ts";

describe("ListBoxSection SSR", () => {
  it("рендерится без гидратационного расхождения с заголовком", async () => {
    const {html} = await ssrSmoke(
      <ListBox aria-label="Users" selectionMode="single">
        <ListBoxSection>
          <Header>Team</Header>
          <ListBox.Item id="bob" textValue="Bob">
            Bob
          </ListBox.Item>
        </ListBoxSection>
      </ListBox>,
    );

    expect(html).toContain('data-slot="list-box-section"');
    expect(html).toContain("Team");
  });
});

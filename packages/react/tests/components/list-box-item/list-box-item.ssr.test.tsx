import {ssrSmoke} from "@peakui/testing/helpers";

import {ListBox} from "@/components/list-box/index.ts";
import {ListBoxItem} from "@/components/list-box-item/index.ts";

describe("ListBoxItem SSR", () => {
  it("рендерится без гидратационного расхождения вместе с индикатором", async () => {
    const {html} = await ssrSmoke(
      <ListBox aria-label="Users" selectionMode="single">
        <ListBoxItem id="bob" textValue="Bob">
          Bob
          <ListBoxItem.Indicator />
        </ListBoxItem>
      </ListBox>,
    );

    expect(html).toContain('data-slot="list-box-item"');
    expect(html).toContain('data-slot="list-box-item-indicator"');
  });
});

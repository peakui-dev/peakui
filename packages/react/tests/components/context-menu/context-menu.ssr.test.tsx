import {ssrSmoke} from "@peakui/testing/helpers";

import {ContextMenu} from "@/components/context-menu";

describe("ContextMenu SSR", () => {
  it("renders the closed state without hydration mismatch", async () => {
    const {html} = await ssrSmoke(
      <ContextMenu>
        <ContextMenu.Trigger>Region</ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              Copy
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>,
    );

    expect(html).toContain('data-slot="context-menu-trigger"');
    expect(html).not.toContain('role="menu"');
  });
});

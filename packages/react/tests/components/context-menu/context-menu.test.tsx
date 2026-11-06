import {render, screen} from "@peakui/testing/helpers";

import {ContextMenu, ContextMenuRoot} from "@/components/context-menu/index.ts";
import {MenuItemIndicator, MenuItemRoot} from "@/components/menu-item/index.ts";
import {MenuSectionRoot} from "@/components/menu-section/index.ts";

describe("ContextMenu", () => {
  it('renders the Trigger as a div with data-slot="context-menu-trigger" and no role, aria-haspopup or tabindex', () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger>Region</ContextMenu.Trigger>
      </ContextMenu>,
    );

    const trigger = screen.getByText("Region");

    expect(trigger.tagName).toBe("DIV");
    expect(trigger).toHaveAttribute("data-slot", "context-menu-trigger");
    expect(trigger).not.toHaveAttribute("role");
    expect(trigger).not.toHaveAttribute("aria-haspopup");
    expect(trigger).not.toHaveAttribute("tabindex");
  });

  it("lets a consumer className reach the Trigger without losing the block class", () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger className="canvas">Region</ContextMenu.Trigger>
      </ContextMenu>,
    );

    const trigger = screen.getByText("Region");

    expect(trigger.className).toEqual(expect.stringContaining("canvas"));
    expect(trigger.className).toEqual(expect.stringContaining("context-menu__trigger"));
  });

  it("supports the render prop on the Trigger", () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger
          render={(props) => <section {...(props as object)} data-testid="custom" />}
        >
          Region
        </ContextMenu.Trigger>
      </ContextMenu>,
    );

    expect(screen.getByTestId("custom").tagName).toBe("SECTION");
    expect(screen.getByTestId("custom")).toHaveAttribute("data-slot", "context-menu-trigger");
  });

  it("renders no menu and no popover when closed", () => {
    render(
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

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector('[data-slot="context-menu-popover"]')).toBeNull();
  });

  it("renders the anchor aria-hidden and inert, portaled to body", () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger>Region</ContextMenu.Trigger>
      </ContextMenu>,
    );

    const anchor = document.querySelector('[data-slot="context-menu-anchor"]');

    expect(anchor).not.toBeNull();
    expect(anchor?.parentElement).toBe(document.body);
    expect(anchor).toHaveAttribute("aria-hidden", "true");
    expect(anchor).toHaveAttribute("inert");
    expect(anchor).not.toHaveAttribute("tabindex");
  });

  it("opens a controlled menu when isOpen is true", () => {
    render(
      <ContextMenu isOpen>
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

    expect(screen.getByRole("menu", {name: "Actions"})).toHaveAttribute(
      "data-slot",
      "context-menu-menu",
    );
    expect(document.querySelector('[data-slot="context-menu-popover"]')).not.toBeNull();
  });

  it("exposes Item, Section and ItemIndicator as aliases of the shared parts", () => {
    expect(ContextMenu.Item).toBe(MenuItemRoot);
    expect(ContextMenu.Section).toBe(MenuSectionRoot);
    expect(ContextMenu.ItemIndicator).toBe(MenuItemIndicator);
    expect(ContextMenu.SubmenuTrigger).toBeDefined();
  });

  it("is the same component as ContextMenu.Root and ContextMenuRoot", () => {
    expect(ContextMenu).toBe(ContextMenuRoot);
    expect(ContextMenu.Root).toBe(ContextMenuRoot);
  });
});

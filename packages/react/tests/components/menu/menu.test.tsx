import {render, screen, setupUser} from "@peakui/testing/helpers";

import {Label} from "@/components/label/index.ts";
import {Menu, MenuRoot} from "@/components/menu/index.ts";
import {
  MenuItemIndicator,
  MenuItemRoot,
  MenuItemSubmenuIndicator,
} from "@/components/menu-item/index.ts";
import {MenuSectionRoot} from "@/components/menu-section/index.ts";

describe("Menu", () => {
  it('renders role=menu with data-slot="menu" and the aria-label', () => {
    render(
      <Menu aria-label="Actions">
        <Menu.Item id="new" textValue="New">
          <Label>New</Label>
        </Menu.Item>
      </Menu>,
    );

    const menu = screen.getByRole("menu", {name: "Actions"});

    expect(menu).toHaveAttribute("data-slot", "menu");
    expect(menu.className).toEqual(expect.stringContaining("menu"));
  });

  it("renders Menu.Item and Menu.Section children with their own data-slots", () => {
    render(
      <Menu aria-label="Actions">
        <Menu.Section aria-label="File">
          <Menu.Item id="new" textValue="New">
            <Label>New</Label>
          </Menu.Item>
        </Menu.Section>
      </Menu>,
    );

    expect(screen.getByRole("menuitem", {name: "New"})).toHaveAttribute("data-slot", "menu-item");
    expect(screen.getByRole("group", {name: "File"})).toHaveAttribute("data-slot", "menu-section");
  });

  it("onAction fires with the item id on click and on Enter", async () => {
    const user = setupUser();
    const onAction = vi.fn();

    render(
      <Menu aria-label="Actions" onAction={onAction}>
        <Menu.Item id="new" textValue="New">
          <Label>New</Label>
        </Menu.Item>
        <Menu.Item id="open" textValue="Open">
          <Label>Open</Label>
        </Menu.Item>
      </Menu>,
    );

    await user.click(screen.getByRole("menuitem", {name: "New"}));

    expect(onAction.mock.lastCall?.[0]).toBe("new");

    screen.getByRole("menuitem", {name: "Open"}).focus();
    await user.keyboard("{Enter}");

    expect(onAction.mock.lastCall?.[0]).toBe("open");
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('selectionMode="multiple" sets data-selection-mode="multiple" and toggles aria-checked', async () => {
    const user = setupUser();

    render(
      <Menu aria-label="Fruit" selectionMode="multiple">
        <Menu.Item id="apple" textValue="Apple">
          <Label>Apple</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
        <Menu.Item id="pear" textValue="Pear">
          <Label>Pear</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
      </Menu>,
    );

    expect(screen.getByRole("menu")).toHaveAttribute("data-selection-mode", "multiple");

    const apple = screen.getByRole("menuitemcheckbox", {name: "Apple"});

    expect(apple).toHaveAttribute("aria-checked", "false");

    await user.click(apple);

    expect(apple).toHaveAttribute("aria-checked", "true");
  });

  it("Menu.Item === MenuItemRoot (alias, not a copy)", () => {
    expect(Menu.Item).toBe(MenuItemRoot);
    expect(Menu.ItemIndicator).toBe(MenuItemIndicator);
    expect(Menu.SubmenuIndicator).toBe(MenuItemSubmenuIndicator);
  });

  it("Menu.Section === MenuSectionRoot", () => {
    expect(Menu.Section).toBe(MenuSectionRoot);
  });

  it("behaves identically as Menu.Root and MenuRoot", () => {
    expect(Menu.Root).toBe(MenuRoot);
    expect(Menu).toBe(MenuRoot);
  });

  it("lets a consumer override data-slot and merge className", () => {
    render(
      <Menu aria-label="Actions" className="custom" data-slot="context-menu-menu">
        <Menu.Item id="new" textValue="New">
          <Label>New</Label>
        </Menu.Item>
      </Menu>,
    );

    const menu = screen.getByRole("menu");

    expect(menu).toHaveAttribute("data-slot", "context-menu-menu");
    expect(menu.className).toEqual(expect.stringContaining("custom"));
  });
});

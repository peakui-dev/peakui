import {fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

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

function Fixture({
  onAction,
  onOpenChange,
  showTrigger = true,
  ...rootProps
}: {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  showTrigger?: boolean;
  onAction?: (key: React.Key) => void;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  return (
    <ContextMenu {...rootProps} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
          <span data-context-menu-native data-testid="native">
            Native
          </span>
        </ContextMenu.Trigger>
      ) : null}
      <ContextMenu.Popover>
        <ContextMenu.Menu aria-label="Actions" onAction={onAction}>
          <ContextMenu.Item id="copy" textValue="Copy">
            Copy
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

function getAnchor() {
  return document.querySelector<HTMLElement>('[data-slot="context-menu-anchor"]');
}

describe("ContextMenu pointer open and dismissal", () => {
  it("opens at the pointer and prevents the browser menu", () => {
    render(<Fixture />);

    const allowed = fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});

    expect(allowed).toBe(false);
    expect(screen.getByRole("menu", {name: "Actions"})).toBeInTheDocument();
    expect(getAnchor()?.style.left).toBe("40px");
    expect(getAnchor()?.style.top).toBe("60px");
  });

  it("moves the anchor on a second contextmenu and keeps the menu open", () => {
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 100, clientY: 120});

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(getAnchor()?.style.left).toBe("100px");
    expect(getAnchor()?.style.top).toBe("120px");
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it("ignores contextmenu when isDisabled and leaves the event alone", () => {
    render(<Fixture isDisabled />);

    const allowed = fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 1, clientY: 2});

    expect(allowed).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("ignores an already-defaultPrevented event", () => {
    render(<Fixture />);

    const event = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      clientX: 1,
      clientY: 2,
    });

    event.preventDefault();
    fireEvent(screen.getByTestId("inner"), event);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the browser menu inside [data-context-menu-native]", () => {
    render(<Fixture />);

    const allowed = fireEvent.contextMenu(screen.getByTestId("native"), {clientX: 1, clientY: 2});

    expect(allowed).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not re-anchor or call onOpenChange for a contextmenu inside the open popover", () => {
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    onOpenChange.mockClear();
    fireEvent.contextMenu(screen.getByRole("menuitem", {name: "Copy"}), {
      clientX: 300,
      clientY: 300,
    });

    expect(getAnchor()?.style.left).toBe("40px");
    expect(getAnchor()?.style.top).toBe("60px");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("reports open changes and honours controlled isOpen", () => {
    const onOpenChange = vi.fn();

    render(<Fixture isOpen={false} onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("mounts open with defaultOpen and anchors the popover to the anchor element", async () => {
    render(<Fixture defaultOpen />);

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(getAnchor()).not.toBeNull();
    expect(getAnchor()?.style.left).toBe("");
    expect(getAnchor()?.style.top).toBe("");
    expect(screen.getByRole("menu").closest('[data-slot="context-menu-popover"]')).not.toBeNull();
  });

  it("closes on Escape", async () => {
    const user = setupUser();
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    await user.keyboard("{Escape}");

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes and fires onAction when an item is selected", async () => {
    const user = setupUser();
    const onAction = vi.fn();

    render(<Fixture onAction={onAction} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    await user.click(screen.getByRole("menuitem", {name: "Copy"}));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0]?.[0]).toBe("copy");
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes when isDisabled turns true while open", () => {
    const {rerender} = render(<Fixture />);

    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    expect(screen.getByRole("menu")).toBeInTheDocument();

    rerender(<Fixture isDisabled />);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("leaves no popover or anchor in body when the Trigger unmounts while open", () => {
    const {rerender} = render(<Fixture />);

    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    expect(screen.getByRole("menu")).toBeInTheDocument();

    rerender(<Fixture showTrigger={false} />);

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.querySelector('[data-slot="context-menu-popover"]')).toBeNull();
    expect(getAnchor()).toBeNull();
  });
});

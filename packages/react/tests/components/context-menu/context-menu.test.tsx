import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {act, fireEvent, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
import {useState} from "react";

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
  nested = false,
  onAction,
  onOpenChange,
  showTrigger = true,
  ...rootProps
}: {
  isOpen?: boolean;
  defaultOpen?: boolean;
  isDisabled?: boolean;
  /** Renders the Popover as a child of the Trigger, so portal events bubble into it. */
  nested?: boolean;
  showTrigger?: boolean;
  onAction?: (key: React.Key) => void;
  onOpenChange?: (isOpen: boolean) => void;
}) {
  const popover = (
    <ContextMenu.Popover>
      <ContextMenu.Menu aria-label="Actions" onAction={onAction}>
        <ContextMenu.Item id="copy" textValue="Copy">
          Copy
        </ContextMenu.Item>
      </ContextMenu.Menu>
    </ContextMenu.Popover>
  );

  return (
    <ContextMenu {...rootProps} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
          <button data-testid="btn" type="button">
            Row
          </button>
          <input aria-label="Name" data-testid="field" />
          <span data-context-menu-native data-testid="native">
            Native
          </span>
          {nested ? popover : null}
        </ContextMenu.Trigger>
      ) : null}
      {nested ? null : popover}
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

  it("moves the anchor on a second contextmenu fired on the region (the browser may not send one: the modal popover makes the page inert)", () => {
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

    render(<Fixture nested onOpenChange={onOpenChange} />);
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

  it("closes on a contextmenu outside the region and the popover, and leaves it to the browser", async () => {
    const onOpenChange = vi.fn();

    render(
      <>
        <Fixture onOpenChange={onOpenChange} />
        <div data-testid="outside">Elsewhere</div>
      </>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    expect(screen.getByRole("menu")).toBeInTheDocument();

    const allowed = fireEvent.contextMenu(screen.getByTestId("outside"), {
      clientX: 300,
      clientY: 300,
    });

    expect(allowed).toBe(true);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("keeps the menu open for a contextmenu fired inside the region and moves the anchor (models an event the browser may not send)", () => {
    const onOpenChange = vi.fn();

    render(
      <>
        <Fixture onOpenChange={onOpenChange} />
        <div data-testid="outside">Elsewhere</div>
      </>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    fireEvent.contextMenu(screen.getByTestId("btn"), {clientX: 100, clientY: 120});

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(getAnchor()?.style.left).toBe("100px");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("does not close for a contextmenu inside the popover when it is outside the region", () => {
    const onOpenChange = vi.fn();

    render(<Fixture onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    onOpenChange.mockClear();
    fireEvent.contextMenu(screen.getByRole("menuitem", {name: "Copy"}), {
      clientX: 300,
      clientY: 300,
    });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps the whole menu open for a contextmenu inside a submenu popover", async () => {
    const user = setupUser();
    const onOpenChange = vi.fn();

    render(
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.SubmenuTrigger>
              <ContextMenu.Item id="more" textValue="More">
                More
              </ContextMenu.Item>
              <ContextMenu.Popover>
                <ContextMenu.Menu aria-label="More actions">
                  <ContextMenu.Item id="telegram" textValue="Telegram">
                    Telegram
                  </ContextMenu.Item>
                </ContextMenu.Menu>
              </ContextMenu.Popover>
            </ContextMenu.SubmenuTrigger>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    await user.keyboard("{ArrowDown}{ArrowRight}");

    const subItem = await screen.findByRole("menuitem", {name: "Telegram"});

    expect(subItem.closest('[data-trigger="SubmenuTrigger"]')).not.toBeNull();
    onOpenChange.mockClear();

    const allowed = fireEvent.contextMenu(subItem, {clientX: 200, clientY: 200});

    expect(allowed).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", {name: "More"})).toBeInTheDocument();
    expect(subItem).toBeInTheDocument();
  });

  it("opens a submenu with ContextMenu.SubmenuTrigger and Popover, and selecting its item fires onAction and closes the menu", async () => {
    const user = setupUser();
    const onAction = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ContextMenu onOpenChange={onOpenChange}>
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.SubmenuTrigger>
              <ContextMenu.Item id="more" textValue="More">
                More
              </ContextMenu.Item>
              <ContextMenu.Popover>
                <ContextMenu.Menu aria-label="More actions" onAction={onAction}>
                  <ContextMenu.Item id="telegram" textValue="Telegram">
                    Telegram
                  </ContextMenu.Item>
                </ContextMenu.Menu>
              </ContextMenu.Popover>
            </ContextMenu.SubmenuTrigger>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    await user.keyboard("{ArrowDown}{ArrowRight}");

    const subItem = await screen.findByRole("menuitem", {name: "Telegram"});

    /* The submenu is its own popover: not pinned to the pointer anchor of the root menu. */
    expect(screen.getAllByRole("menu")).toHaveLength(2);
    expect(subItem).toHaveFocus();

    await user.keyboard("{Enter}");

    await waitFor(() => expect(onAction).toHaveBeenCalledTimes(1));
    expect(onAction.mock.calls[0]?.[0]).toBe("telegram");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("does not close for an outside contextmenu whose default was already prevented", () => {
    const onOpenChange = vi.fn();

    render(
      <>
        <Fixture onOpenChange={onOpenChange} />
        <div
          data-testid="outside"
          onContextMenu={(event) => {
            event.preventDefault();
          }}
        >
          Elsewhere
        </div>
      </>,
    );
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
    onOpenChange.mockClear();
    fireEvent.contextMenu(screen.getByTestId("outside"));

    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("removes the document contextmenu listener after close and on unmount", async () => {
    const add = vi.spyOn(document, "addEventListener");
    const remove = vi.spyOn(document, "removeEventListener");
    const ours = (spy: typeof add) => spy.mock.calls.filter(([type]) => type === "contextmenu");

    try {
      const {unmount} = render(<Fixture />);

      expect(ours(add)).toHaveLength(0);

      fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 1, clientY: 2});
      expect(ours(add)).toHaveLength(1);

      const handler = ours(add)[0]![1];

      fireEvent.keyDown(screen.getByRole("menu"), {key: "Escape"});
      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
      expect(ours(remove).map(([, listener]) => listener)).toContain(handler);

      fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 1, clientY: 2});
      expect(ours(add)).toHaveLength(2);

      const second = ours(add)[1]![1];

      unmount();
      expect(ours(remove).map(([, listener]) => listener)).toContain(second);
    } finally {
      add.mockRestore();
      remove.mockRestore();
    }
  });

  it("reports open changes and honours controlled isOpen", () => {
    const onOpenChange = vi.fn();

    render(<Fixture isOpen={false} onOpenChange={onOpenChange} />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("anchors a defaultOpen menu at the bottom-start corner of the Trigger", async () => {
    const rect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        const isTrigger = this.dataset.slot === "context-menu-trigger";

        return {
          bottom: isTrigger ? 150 : 0,
          height: 0,
          left: isTrigger ? 30 : 0,
          right: 0,
          toJSON: () => ({}),
          top: 0,
          width: 0,
          x: 0,
          y: 0,
        };
      });

    try {
      render(<Fixture defaultOpen />);

      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("30px");
      expect(getAnchor()?.style.top).toBe("150px");
    } finally {
      rect.mockRestore();
    }
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

interface MockRect {
  left: number;
  bottom: number;
  width: number;
  height: number;
}

/** Mocks getBoundingClientRect by data-testid or data-slot; unlisted elements get a zero rect. */
function mockRects(rects: Record<string, MockRect>) {
  return vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const rect = rects[this.dataset.testid ?? ""] ?? rects[this.dataset.slot ?? ""] ?? rects["*"];

    return {
      bottom: rect?.bottom ?? 0,
      height: rect?.height ?? 0,
      left: rect?.left ?? 0,
      right: 0,
      toJSON: () => ({}),
      top: 0,
      width: rect?.width ?? 0,
      x: 0,
      y: 0,
    };
  });
}

function ControlledFixture({rejectOpen = false}: {rejectOpen?: boolean}) {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button data-testid="external" type="button" onClick={() => setOpen(true)}>
        External
      </button>
      <ContextMenu
        isOpen={isOpen}
        onOpenChange={(next) => {
          // A parent that refuses every open request coming from the Trigger.
          if (!rejectOpen || !next) {
            setOpen(next);
          }
        }}
      >
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
          <button data-testid="btn" type="button">
            Row
          </button>
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              Copy
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </>
  );
}

describe("ContextMenu keyboard open and focus", () => {
  it("opens on Shift+F10 anchored to the focused descendant and prevents default", async () => {
    const rect = mockRects({btn: {bottom: 50, height: 20, left: 10, width: 20}});

    try {
      render(<Fixture />);

      const allowed = fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});

      expect(allowed).toBe(false);
      expect(await screen.findByRole("menu", {name: "Actions"})).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("10px");
      expect(getAnchor()?.style.top).toBe("50px");
    } finally {
      rect.mockRestore();
    }
  });

  it("opens on the ContextMenu key the same way", async () => {
    const rect = mockRects({btn: {bottom: 50, height: 20, left: 10, width: 20}});

    try {
      render(<Fixture />);

      const allowed = fireEvent.keyDown(screen.getByTestId("btn"), {key: "ContextMenu"});

      expect(allowed).toBe(false);
      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("10px");
      expect(getAnchor()?.style.top).toBe("50px");
    } finally {
      rect.mockRestore();
    }
  });

  it("ignores F10 without Shift", () => {
    render(<Fixture />);

    const allowed = fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10"});

    expect(allowed).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("focuses the first item after a keyboard open", async () => {
    render(<Fixture />);
    screen.getByTestId("btn").focus();
    fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});

    const item = await screen.findByRole("menuitem", {name: "Copy"});

    expect(document.activeElement).toBe(item);
  });

  it("focuses the menu container after a pointer open", async () => {
    render(<Fixture />);
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});

    const menu = await screen.findByRole("menu");

    expect(document.activeElement).toBe(menu);
  });

  it("closes on Escape and returns focus to the descendant that opened it", async () => {
    const user = setupUser();

    render(<Fixture />);

    const button = screen.getByTestId("btn");

    button.focus();
    fireEvent.keyDown(button, {key: "F10", shiftKey: true});
    await screen.findByRole("menu");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(button));
  });

  it("falls back to the Trigger rect when the focused element has a zero-size rect", async () => {
    const rect = mockRects({
      btn: {bottom: 0, height: 0, left: 0, width: 0},
      "context-menu-trigger": {bottom: 150, height: 100, left: 30, width: 200},
    });

    try {
      render(<Fixture />);
      fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});

      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("30px");
      expect(getAnchor()?.style.top).toBe("150px");
    } finally {
      rect.mockRestore();
    }
  });

  it("does not reopen or re-anchor on a key pressed inside the open popover", async () => {
    const onOpenChange = vi.fn();
    // Every element but the button measures at (300, 400), so a re-anchor from the item is visible.
    const rect = mockRects({
      "*": {bottom: 400, height: 20, left: 300, width: 20},
      btn: {bottom: 50, height: 20, left: 10, width: 20},
    });

    try {
      render(<Fixture nested onOpenChange={onOpenChange} />);
      fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});

      const item = await screen.findByRole("menuitem", {name: "Copy"});

      onOpenChange.mockClear();

      const allowed = fireEvent.keyDown(item, {key: "F10", shiftKey: true});

      expect(allowed).toBe(true);
      expect(getAnchor()?.style.left).toBe("10px");
      expect(getAnchor()?.style.top).toBe("50px");
      expect(onOpenChange).not.toHaveBeenCalled();
    } finally {
      rect.mockRestore();
    }
  });

  it("opens on Shift+F10 inside an input in the region", async () => {
    render(<Fixture />);

    const allowed = fireEvent.keyDown(screen.getByTestId("field"), {key: "F10", shiftKey: true});

    expect(allowed).toBe(false);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });

  it("ignores keys when isDisabled", () => {
    render(<Fixture isDisabled />);

    const shift = fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});
    const menuKey = fireEvent.keyDown(screen.getByTestId("btn"), {key: "ContextMenu"});

    expect(shift).toBe(true);
    expect(menuKey).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it.each([
    ["Ctrl+Shift+F10", {ctrlKey: true}],
    ["Alt+Shift+F10", {altKey: true}],
    ["Meta+Shift+F10", {metaKey: true}],
  ])("leaves %s to the browser", (_name, modifier) => {
    render(<Fixture />);

    const allowed = fireEvent.keyDown(screen.getByTestId("btn"), {
      key: "F10",
      shiftKey: true,
      ...modifier,
    });

    expect(allowed).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("leaves Ctrl+ContextMenu to the browser", () => {
    render(<Fixture />);

    const allowed = fireEvent.keyDown(screen.getByTestId("btn"), {
      ctrlKey: true,
      key: "ContextMenu",
    });

    expect(allowed).toBe(true);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not re-anchor an open menu on a repeated keydown", async () => {
    const rect = mockRects({
      btn: {bottom: 50, height: 20, left: 10, width: 20},
      field: {bottom: 90, height: 20, left: 70, width: 20},
    });

    try {
      render(<Fixture />);
      fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});
      await screen.findByRole("menu");

      const allowed = fireEvent.keyDown(screen.getByTestId("field"), {
        key: "F10",
        repeat: true,
        shiftKey: true,
      });

      expect(allowed).toBe(true);
      expect(getAnchor()?.style.left).toBe("10px");
      expect(getAnchor()?.style.top).toBe("50px");
    } finally {
      rect.mockRestore();
    }
  });

  it("opens on Shift+F10 inside [data-context-menu-native] (the opt-out is pointer-only)", async () => {
    render(<Fixture />);

    const allowed = fireEvent.keyDown(screen.getByTestId("native"), {key: "F10", shiftKey: true});

    expect(allowed).toBe(false);
    expect(await screen.findByRole("menu")).toBeInTheDocument();
  });

  it("ignores a keydown whose default was already prevented", () => {
    render(<Fixture />);

    const event = new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key: "F10",
      shiftKey: true,
    });

    event.preventDefault();
    fireEvent(screen.getByTestId("btn"), event);

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("re-anchors on Shift+F10 while a pointer-opened menu is open and leaves focus where it is", async () => {
    const rect = mockRects({btn: {bottom: 50, height: 20, left: 10, width: 20}});

    try {
      render(<Fixture />);
      fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});

      const menu = await screen.findByRole("menu");

      expect(document.activeElement).toBe(menu);

      fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});

      expect(getAnchor()?.style.left).toBe("10px");
      expect(getAnchor()?.style.top).toBe("50px");
      expect(screen.getByRole("menu")).toBe(menu);
      // RAC reads autoFocus on mount only, so the open menu keeps its focus target.
      expect(document.activeElement).toBe(menu);
    } finally {
      rect.mockRestore();
    }
  });

  it("focuses the menu container, not the first item, when a controlled open follows a keyboard open", async () => {
    const user = setupUser();

    render(<ControlledFixture />);
    screen.getByTestId("btn").focus();
    fireEvent.keyDown(screen.getByTestId("btn"), {key: "ContextMenu"});

    const item = await screen.findByRole("menuitem", {name: "Copy"});

    expect(document.activeElement).toBe(item);

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();

    await user.click(screen.getByTestId("external"));

    const menu = await screen.findByRole("menu");

    expect(document.activeElement).toBe(menu);
  });

  it("anchors at the Trigger when a controlled parent rejected an earlier keyboard open", async () => {
    const user = setupUser();
    const rect = mockRects({
      btn: {bottom: 50, height: 20, left: 10, width: 20},
      "context-menu-trigger": {bottom: 150, height: 100, left: 30, width: 200},
    });

    try {
      render(<ControlledFixture rejectOpen />);
      fireEvent.keyDown(screen.getByTestId("btn"), {key: "F10", shiftKey: true});
      expect(screen.queryByRole("menu")).toBeNull();

      await user.click(screen.getByTestId("external"));

      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("30px");
      expect(getAnchor()?.style.top).toBe("150px");
    } finally {
      rect.mockRestore();
    }
  });

  it("does not reuse a stale pointer position when the menu reopens without a pointer", async () => {
    const user = setupUser();
    const rect = mockRects({
      "context-menu-trigger": {bottom: 150, height: 100, left: 30, width: 200},
    });

    try {
      render(<ControlledFixture />);
      fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 40, clientY: 60});
      await screen.findByRole("menu");
      await user.keyboard("{Escape}");
      expect(screen.queryByRole("menu")).toBeNull();

      await user.click(screen.getByTestId("external"));

      expect(await screen.findByRole("menu")).toBeInTheDocument();
      expect(getAnchor()?.style.left).toBe("30px");
      expect(getAnchor()?.style.top).toBe("150px");
    } finally {
      rect.mockRestore();
    }
  });
});

function touch(
  target: Element,
  type: "pointerDown" | "pointerMove" | "pointerUp",
  point: {x: number; y: number},
) {
  fireEvent[type](target, {
    button: 0,
    clientX: point.x,
    clientY: point.y,
    height: 2,
    pointerId: 7,
    pointerType: "touch",
    width: 2,
  });
}

describe("ContextMenu touch long-press", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens, anchored to the touch point, when a touch is held past the threshold", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.queryByRole("menu")).toBeNull();

    act(() => {
      vi.advanceTimersByTime(2);
    });

    expect(screen.getByRole("menu", {name: "Actions"})).toBeInTheDocument();
    expect(getAnchor()?.style.left).toBe("40px");
    expect(getAnchor()?.style.top).toBe("60px");
  });

  it("does not open when the touch is released before the threshold", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(200);
    });
    touch(screen.getByTestId("inner"), "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not open when a mouse button is held past the threshold", () => {
    render(<Fixture />);
    fireEvent.pointerDown(screen.getByTestId("inner"), {
      button: 0,
      clientX: 40,
      clientY: 60,
      height: 2,
      pointerId: 1,
      pointerType: "mouse",
      width: 2,
    });
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("cancels the long-press when the finger moves past the tolerance", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(200);
    });
    touch(screen.getByTestId("inner"), "pointerMove", {x: 40, y: 90});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("keeps the long-press alive for a small tremor within the tolerance", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    touch(screen.getByTestId("inner"), "pointerMove", {x: 43, y: 62});
    act(() => {
      vi.advanceTimersByTime(600);
    });

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(getAnchor()?.style.left).toBe("40px");
  });

  it("does not activate the item under the finger when it is released after the open", () => {
    const onAction = vi.fn();

    render(<Fixture onAction={onAction} />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const item = screen.getByRole("menuitem", {name: "Copy"});

    touch(item, "pointerUp", {x: 40, y: 60});
    fireEvent.mouseUp(item);
    fireEvent.click(item);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("lets a later tap on an item activate it once the release window has passed", () => {
    const onAction = vi.fn();

    render(<Fixture onAction={onAction} />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });
    touch(screen.getByRole("menuitem", {name: "Copy"}), "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const item = screen.getByRole("menuitem", {name: "Copy"});

    touch(item, "pointerDown", {x: 50, y: 70});
    touch(item, "pointerUp", {x: 50, y: 70});
    fireEvent.click(item);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0]?.[0]).toBe("copy");
  });

  it("ignores the native contextmenu that follows a long-press: no reopen, no re-anchor", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });
    touch(screen.getByTestId("inner"), "pointerUp", {x: 40, y: 60});
    // Past the press hook's own 100 ms suppression, inside this component's release window.
    act(() => {
      vi.advanceTimersByTime(200);
    });

    const allowed = fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 90, clientY: 95});

    expect(allowed).toBe(false);
    expect(getAnchor()?.style.left).toBe("40px");
    expect(getAnchor()?.style.top).toBe("60px");
  });

  it("does not close the menu on the native contextmenu that follows a long-press, even outside the region", () => {
    render(
      <>
        <Fixture />
        <div data-testid="outside">Elsewhere</div>
      </>,
    );
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });
    touch(screen.getByTestId("inner"), "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(200);
    });

    fireEvent.contextMenu(screen.getByTestId("outside"), {clientX: 90, clientY: 95});

    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("opens from a right-click again once the release window has passed", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });
    touch(screen.getByTestId("inner"), "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    fireEvent.contextMenu(screen.getByTestId("inner"), {clientX: 90, clientY: 95});

    expect(getAnchor()?.style.left).toBe("90px");
  });

  it("does not long-press when isDisabled", () => {
    render(<Fixture isDisabled />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not long-press inside [data-context-menu-native]", () => {
    render(<Fixture />);
    touch(screen.getByTestId("native"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not re-anchor on a long-press inside the open popover that bubbles to a nested Trigger", () => {
    render(<Fixture nested />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });
    touch(screen.getByTestId("inner"), "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    touch(screen.getByRole("menuitem", {name: "Copy"}), "pointerDown", {x: 200, y: 210});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(getAnchor()?.style.left).toBe("40px");
  });

  it("does not swallow a descendant's click for the Trigger's ancestors", () => {
    const onClick = vi.fn();

    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={onClick}>
        <Fixture />
      </div>,
    );
    fireEvent.click(screen.getByTestId("btn"));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("carries the block class the touch-callout and user-select suppression is keyed on", () => {
    render(<Fixture />);

    const trigger = document.querySelector('[data-slot="context-menu-trigger"]');
    const css = readFileSync(
      resolve(import.meta.dirname, "../../../../styles/components/context-menu.css"),
      "utf8",
    );
    // The trigger rule: from its selector to the closing brace that balances the opening one.
    const start = css.indexOf(".context-menu__trigger {");
    let depth = 0;
    let end = start;

    for (let i = css.indexOf("{", start); i < css.length; i++) {
      depth += css[i] === "{" ? 1 : css[i] === "}" ? -1 : 0;

      if (depth === 0) {
        end = i;
        break;
      }
    }

    const rule = css.slice(start, end + 1);
    const coarse = /@media \(pointer: coarse\)\s*\{([^}]*)\}/.exec(rule)?.[1] ?? "";

    expect(start).toBeGreaterThanOrEqual(0);
    expect(trigger).toHaveClass("context-menu__trigger");
    expect(coarse).toContain("-webkit-touch-callout: none");
    expect(coarse).toContain("-webkit-user-select: none");
    expect(coarse).toContain("user-select: none");
    // Native-menu descendants keep selectable text on coarse pointers.
    expect(rule).toMatch(
      /:where\(\[data-context-menu-native\]\)[^{]*\{[^}]*-webkit-user-select: auto[^}]*user-select: auto/,
    );
  });

  it("cancels the long-press when the browser cancels the touch (scrolling)", () => {
    render(<Fixture />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerCancel(screen.getByTestId("inner"), {pointerId: 7, pointerType: "touch"});
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("does not prevent the default of a descendant link or checkbox click in an enabled region", () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger>
          <a data-testid="link" href="#x">
            Link
          </a>
          <input aria-label="Check" data-testid="check" type="checkbox" />
        </ContextMenu.Trigger>
      </ContextMenu>,
    );

    expect(fireEvent.click(screen.getByTestId("link"))).toBe(true);
    expect(fireEvent.click(screen.getByTestId("check"))).toBe(true);
  });

  it("does not prevent the default of a descendant link or checkbox click when isDisabled", () => {
    render(
      <ContextMenu isDisabled>
        <ContextMenu.Trigger>
          <a data-testid="link" href="#x">
            Link
          </a>
          <input aria-label="Check" data-testid="check" type="checkbox" />
        </ContextMenu.Trigger>
      </ContextMenu>,
    );

    expect(fireEvent.click(screen.getByTestId("link"))).toBe(true);
    expect(fireEvent.click(screen.getByTestId("check"))).toBe(true);
  });

  it("does not prevent the default of a dragstart from a draggable child", () => {
    render(
      <ContextMenu>
        <ContextMenu.Trigger>
          <div draggable data-testid="drag">
            Drag me
          </div>
        </ContextMenu.Trigger>
      </ContextMenu>,
    );

    expect(fireEvent.dragStart(screen.getByTestId("drag"))).toBe(true);
  });

  it("lets a second tap on the popover through while the release window is still open", () => {
    const onAction = vi.fn();

    render(<Fixture onAction={onAction} />);
    touch(screen.getByTestId("inner"), "pointerDown", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(600);
    });

    const item = screen.getByRole("menuitem", {name: "Copy"});

    touch(item, "pointerUp", {x: 40, y: 60});
    act(() => {
      vi.advanceTimersByTime(100);
    });
    touch(item, "pointerDown", {x: 50, y: 70});
    touch(item, "pointerUp", {x: 50, y: 70});
    fireEvent.click(item);
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});

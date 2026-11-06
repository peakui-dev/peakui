import {fireEvent, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
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

function ControlledFixture() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button data-testid="external" type="button" onClick={() => setOpen(true)}>
        External
      </button>
      <ContextMenu isOpen={isOpen} onOpenChange={setOpen}>
        <ContextMenu.Trigger>
          <span data-testid="inner">Region</span>
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

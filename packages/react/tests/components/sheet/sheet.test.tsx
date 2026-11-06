import {cleanup, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
import {useState} from "react";

import {Button} from "@/components/button";
import {
  Sheet,
  SheetBackdrop,
  SheetBody,
  SheetClose,
  SheetCloseTrigger,
  SheetContent,
  SheetDialog,
  SheetHeading,
  SheetNestedRoot,
  SheetRoot,
  SheetTrigger,
} from "@/components/sheet/index.ts";

type Placement = "top" | "bottom" | "left" | "right";

/*
 * jsdom has no layout, no scroll-snap and no view timelines, and RAC's Sheet is driven by all
 * three: it scrolls its scroller to enter and exit, and closes the overlay when an
 * IntersectionObserver reports the panel gone. This stub plays that script: a scroll to the exited
 * position reports the panel hidden, any other scroll reports it visible, and `scrollend` follows.
 * It proves the wiring to RAC (open, close, labelling, focus, dismissal, the context), not the
 * scrolling itself, which is a browser-tier concern.
 */
const observers = new Set<{callback: IntersectionObserverCallback; element: Element}>();

class StubIntersectionObserver {
  private entry?: {callback: IntersectionObserverCallback; element: Element};

  constructor(private callback: IntersectionObserverCallback) {}

  observe(element: Element) {
    this.entry = {callback: this.callback, element};
    observers.add(this.entry);
  }

  unobserve() {}

  disconnect() {
    if (this.entry) observers.delete(this.entry);
  }

  takeRecords() {
    return [];
  }
}

function installSheetGeometry(exitedAtZero = true) {
  vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
  // jsdom does not implement scrollTo, so there is nothing to spy on: define it, remove it after.
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: function scrollTo(this: HTMLElement, options?: ScrollToOptions | number) {
      const target = typeof options === "object" ? (options.top ?? options.left ?? 0) : 0;
      const exited = exitedAtZero ? target === 0 : target > 0;

      // RAC registers its listeners right after it scrolls, so everything follows asynchronously.
      setTimeout(() => {
        for (const {callback, element} of observers) {
          callback(
            [{intersectionRatio: exited ? 0 : 1, target: element} as IntersectionObserverEntry],
            {} as IntersectionObserver,
          );
        }
        this.dispatchEvent(new Event("scrollend"));
      }, 0);
    },
    writable: true,
  });
}

function removeSheetGeometry() {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
}

const SheetExample = ({
  defaultOpen,
  isDismissable,
  isOpen,
  onClose,
  onOpenChange,
  placement,
  snapPoints,
}: {
  defaultOpen?: boolean;
  isDismissable?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  snapPoints?: Array<number | string>;
} = {}) => (
  <Sheet
    defaultOpen={defaultOpen}
    isDismissable={isDismissable}
    isOpen={isOpen}
    placement={placement}
    snapPoints={snapPoints}
    onClose={onClose}
    onOpenChange={onOpenChange}
  >
    <Sheet.Trigger>
      <Button>Open</Button>
    </Sheet.Trigger>
    <Sheet.Backdrop>
      <Sheet.Content>
        <Sheet.Dialog>
          <Sheet.Heading>Title</Sheet.Heading>
          <Sheet.Body>Content</Sheet.Body>
          <Sheet.CloseTrigger />
          <Sheet.Close>
            <Button>Done</Button>
          </Sheet.Close>
        </Sheet.Dialog>
      </Sheet.Content>
    </Sheet.Backdrop>
  </Sheet>
);

const openSheet = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole("button", {name: "Open"}));

  return screen.findByRole("dialog");
};

describe("Sheet", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    installSheetGeometry();
    user = setupUser();
  });

  afterEach(() => {
    cleanup();
    observers.clear();
    removeSheetGeometry();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("open and close", () => {
    it("renders nothing until the trigger is pressed", async () => {
      render(<SheetExample />);

      expect(screen.queryByRole("dialog")).toBeNull();

      const dialog = await openSheet(user);

      expect(dialog).toHaveTextContent("Content");
    });

    it("opens at mount with defaultOpen", () => {
      render(<SheetExample defaultOpen />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes on Escape", async () => {
      render(<SheetExample />);
      await openSheet(user);

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("closes with the close trigger", async () => {
      render(<SheetExample />);
      await openSheet(user);

      await user.click(screen.getByRole("button", {name: "Close"}));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("closes with Sheet.Close around any element", async () => {
      render(<SheetExample />);
      await openSheet(user);

      await user.click(screen.getByRole("button", {name: "Done"}));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("fires onClose once when closing is requested", async () => {
      const onClose = vi.fn();

      render(<SheetExample onClose={onClose} />);
      await openSheet(user);

      await user.click(screen.getByRole("button", {name: "Done"}));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("does not fire onClose when the sheet opens", async () => {
      const onClose = vi.fn();

      render(<SheetExample onClose={onClose} />);
      await openSheet(user);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe("controlled", () => {
    it("stays closed until isOpen is true", async () => {
      const onOpenChange = vi.fn();
      const {rerender} = render(<SheetExample isOpen={false} onOpenChange={onOpenChange} />);

      await user.click(screen.getByRole("button", {name: "Open"}));

      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(screen.queryByRole("dialog")).toBeNull();

      rerender(<SheetExample isOpen onOpenChange={onOpenChange} />);

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("reports Escape through onOpenChange(false) and leaves the state to the owner", async () => {
      const onOpenChange = vi.fn();

      render(<SheetExample isOpen onOpenChange={onOpenChange} />);
      await screen.findByRole("dialog");

      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("works with state held by the consumer, without a trigger", async () => {
      const Controlled = () => {
        const [open, setOpen] = useState(false);

        return (
          <>
            <Button onPress={() => setOpen(true)}>Open</Button>
            <Sheet isOpen={open} onOpenChange={setOpen}>
              <Sheet.Backdrop>
                <Sheet.Content>
                  <Sheet.Dialog>
                    <Sheet.Heading>Title</Sheet.Heading>
                  </Sheet.Dialog>
                </Sheet.Content>
              </Sheet.Backdrop>
            </Sheet>
          </>
        );
      };

      render(<Controlled />);
      expect(screen.queryByRole("dialog")).toBeNull();

      await user.click(screen.getByRole("button", {name: "Open"}));
      expect(await screen.findByRole("dialog", {name: "Title"})).toBeInTheDocument();

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });

  describe("accessibility", () => {
    it("labels the dialog by its heading", async () => {
      render(<SheetExample />);
      await openSheet(user);

      expect(screen.getByRole("dialog", {name: "Title"})).toBeInTheDocument();
    });

    it("moves focus into the dialog and returns it to the trigger on close", async () => {
      render(<SheetExample />);

      const dialog = await openSheet(user);

      await waitFor(() => expect(dialog).toContainElement(document.activeElement as HTMLElement));

      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      // FocusScope restores focus on the next animation frame.
      await waitFor(() => expect(screen.getByRole("button", {name: "Open"})).toHaveFocus());
    });

    it("makes the page behind inert while open", async () => {
      render(<SheetExample />);

      expect(screen.getByRole("button", {name: "Open"})).toBeInTheDocument();

      await openSheet(user);

      expect(screen.queryByRole("button", {name: "Open"})).toBeNull();
    });
  });

  describe("dismissal", () => {
    it("closes on an outside press", async () => {
      const onOpenChange = vi.fn();

      render(<SheetExample onOpenChange={onOpenChange} />);
      await openSheet(user);

      await user.click(document.querySelector('[data-slot="sheet-backdrop"]') as HTMLElement);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("does not close on Escape or an outside press when isDismissable is false", async () => {
      const onOpenChange = vi.fn();

      render(<SheetExample isDismissable={false} onOpenChange={onOpenChange} />);
      await openSheet(user);

      await user.keyboard("{Escape}");
      await user.click(document.querySelector('[data-slot="sheet-backdrop"]') as HTMLElement);

      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("still closes with an explicit close control when isDismissable is false", async () => {
      render(<SheetExample isDismissable={false} />);
      await openSheet(user);

      await user.click(screen.getByRole("button", {name: "Done"}));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });
  });

  describe("structure", () => {
    it("exposes data-slot on every part", async () => {
      render(<SheetExample snapPoints={[0.5]} />);
      await openSheet(user);

      for (const slot of [
        "sheet-overlay",
        "sheet-backdrop",
        "sheet-content",
        "sheet-dialog",
        "sheet-heading",
        "sheet-body",
        "sheet-close-trigger",
      ]) {
        expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
      }
    });

    it("sets data-placement on content and dialog", async () => {
      render(<SheetExample placement="left" />);
      await openSheet(user);

      expect(document.querySelector('[data-slot="sheet-content"]')).toHaveAttribute(
        "data-placement",
        "left",
      );
      expect(document.querySelector('[data-slot="sheet-dialog"]')).toHaveAttribute(
        "data-placement",
        "left",
      );
    });

    it("sets data-snap-points on the content only when snap points exist", async () => {
      const {rerender} = render(<SheetExample snapPoints={[0.4, 0.8]} />);

      await openSheet(user);
      expect(document.querySelector('[data-slot="sheet-content"]')).toHaveAttribute(
        "data-snap-points",
      );

      await user.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      rerender(<SheetExample />);
      await openSheet(user);

      expect(document.querySelector('[data-slot="sheet-content"]')).not.toHaveAttribute(
        "data-snap-points",
      );
    });

    it("sets data-detached on the content only when isDetached", async () => {
      render(
        <Sheet isDetached>
          <Sheet.Trigger>
            <Button>Open</Button>
          </Sheet.Trigger>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog>
                <Sheet.Heading>Title</Sheet.Heading>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );
      await openSheet(user);

      expect(document.querySelector('[data-slot="sheet-content"]')).toHaveAttribute(
        "data-detached",
      );
    });

    it("merges a consumer className with the block on content and dialog", async () => {
      render(
        <Sheet defaultOpen>
          <Sheet.Backdrop className="custom-backdrop">
            <Sheet.Content className="custom-content">
              <Sheet.Dialog className="custom-dialog">
                <Sheet.Heading>Title</Sheet.Heading>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );

      expect(document.querySelector('[data-slot="sheet-overlay"]')).toHaveClass(
        "sheet__overlay",
        "custom-backdrop",
      );
      expect(document.querySelector('[data-slot="sheet-content"]')).toHaveClass(
        "sheet__content",
        "custom-content",
      );
      expect(document.querySelector('[data-slot="sheet-dialog"]')).toHaveClass(
        "sheet__dialog",
        "custom-dialog",
      );
    });

    it("keeps its own data-slot after a consumer spread", async () => {
      render(
        <Sheet defaultOpen>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog>
                <Sheet.Header {...({"data-slot": "intruder"} as object)}>
                  <Sheet.Heading>Title</Sheet.Heading>
                </Sheet.Header>
                <Sheet.Footer {...({"data-slot": "intruder"} as object)}>x</Sheet.Footer>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );

      expect(document.querySelector('[data-slot="sheet-header"]')).not.toBeNull();
      expect(document.querySelector('[data-slot="sheet-footer"]')).not.toBeNull();
      expect(document.querySelector('[data-slot="intruder"]')).toBeNull();
    });

    it("renders the handle decoratively", async () => {
      render(
        <Sheet defaultOpen>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog>
                <Sheet.Handle />
                <Sheet.Heading>Title</Sheet.Heading>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );

      expect(document.querySelector('[data-slot="sheet-handle"]')).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
  });

  describe("call styles", () => {
    it("behaves identically as Sheet.* and as the named exports", async () => {
      render(
        <SheetRoot>
          <SheetTrigger>
            <Button>Open</Button>
          </SheetTrigger>
          <SheetBackdrop>
            <SheetContent>
              <SheetDialog>
                <SheetHeading>Title</SheetHeading>
                <SheetBody>Content</SheetBody>
                <SheetCloseTrigger />
                <SheetClose>
                  <Button>Done</Button>
                </SheetClose>
              </SheetDialog>
            </SheetContent>
          </SheetBackdrop>
        </SheetRoot>,
      );

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(await openSheet(user)).toHaveAccessibleName("Title");

      await user.click(screen.getByRole("button", {name: "Done"}));

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      expect(Sheet.Trigger).toBe(SheetTrigger);
      expect(Sheet.Root).toBe(SheetRoot);
    });
  });

  describe("trigger detection", () => {
    const Parts = () => (
      <Sheet.Backdrop>
        <Sheet.Content>
          <Sheet.Dialog>
            <Sheet.Heading>Title</Sheet.Heading>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    );

    it("opens from a Trigger inside a fragment", async () => {
      render(
        <Sheet>
          <>
            <Sheet.Trigger>
              <Button>Open</Button>
            </Sheet.Trigger>
          </>
          <Parts />
        </Sheet>,
      );

      expect(await openSheet(user)).toHaveAccessibleName("Title");
    });

    it("opens from a Trigger inside a nested array", async () => {
      render(
        <Sheet>
          {[
            <Sheet.Trigger key="t">
              <Button>Open</Button>
            </Sheet.Trigger>,
          ]}
          <Parts />
        </Sheet>,
      );

      expect(await openSheet(user)).toHaveAccessibleName("Title");
    });

    it("does not detect a Trigger rendered by a wrapper component, and warns once", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const Wrapped = () => (
        <Sheet.Trigger>
          <Button>Open</Button>
        </Sheet.Trigger>
      );

      render(
        <Sheet>
          <Wrapped />
          <Parts />
        </Sheet>,
      );
      await user.click(screen.getByRole("button", {name: "Open"}));

      expect(screen.queryByRole("dialog")).toBeNull();
      expect(error).toHaveBeenCalledTimes(1);
      expect(error.mock.calls[0]?.[0]).toContain("Sheet.Trigger must be a direct child of Sheet");
    });

    it("does not warn for a detected Trigger", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<SheetExample />);
      await openSheet(user);

      expect(error).not.toHaveBeenCalled();
    });
  });

  describe("context", () => {
    it("keeps isNested out of the public props", () => {
      // @ts-expect-error isNested is internal to Sheet.NestedRoot
      const element = <Sheet isNested>x</Sheet>;

      expect(element).toBeTruthy();
    });

    it("throws a clear error when NestedRoot is rendered outside a Sheet", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<SheetNestedRoot>x</SheetNestedRoot>)).toThrow(
        "Sheet.NestedRoot must be placed in another Sheet",
      );
      error.mockRestore();
    });

    it("throws a clear error when a part is rendered outside a Sheet", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<SheetBody>x</SheetBody>)).toThrow(
        "useSheetContext must be used within a Sheet",
      );
      error.mockRestore();
    });
  });

  // Pinned in later tasks.
  it.todo("data-exiting is present on Backdrop, Content and Dialog during exit");
  it.todo("runs the lifecycle: onAnimationEnd and retained exit (Task 5)");
  it.todo("operates the handle as a slider (Task 6)");
  it.todo("drags the handle and settles on snap points (Task 7)");
  it.todo("stacks nested sheets and closes the topmost first (Task 8)");
});

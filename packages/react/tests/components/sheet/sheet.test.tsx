import {act, cleanup, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
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
import {
  getSheetScroller,
  getSheetSnapTargets,
  scrollSheetTo,
  snapScrollPosition,
} from "@/components/sheet/sheet-scroll.ts";

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

/*
 * The scroll the stub is currently playing, and the controls the lifecycle tests use on it. Like a
 * browser, a new scroll supersedes the one in flight: only the last one settles. `panelVisible`
 * is what the dialog's rect reports, so the lifecycle's geometry check sees the settled position.
 */
let panelVisible = false;
let holdScrolls = false;
let swallowScrolls = false;
let pendingSettle: (() => void) | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
const scrollCalls: ScrollToOptions[] = [];

function resetSheetGeometry() {
  clearTimeout(pendingTimer);
  pendingSettle = null;
  panelVisible = false;
  holdScrolls = false;
  swallowScrolls = false;
  scrollCalls.length = 0;
}

/** Settles the held scroll, as the browser would when the animation ends. */
function flushScrolls() {
  const settle = pendingSettle;

  pendingSettle = null;
  if (settle) act(settle);
}

function installSheetGeometry(exitedAtZero = true) {
  vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
  // jsdom does not implement scrollTo, so there is nothing to spy on: define it, remove it after.
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    value: function scrollTo(this: HTMLElement, options?: ScrollToOptions | number) {
      const request = typeof options === "object" ? options : {};
      const target = request.top ?? request.left ?? 0;
      const exited = exitedAtZero ? target === 0 : target > 0;

      scrollCalls.push(request);
      if (swallowScrolls) return;

      clearTimeout(pendingTimer);

      const settle = () => {
        pendingSettle = null;
        panelVisible = !exited;
        Object.defineProperty(this, request.top === undefined ? "scrollLeft" : "scrollTop", {
          configurable: true,
          value: target,
          writable: true,
        });
        for (const {callback, element} of observers) {
          callback(
            [{intersectionRatio: exited ? 0 : 1, target: element} as IntersectionObserverEntry],
            {} as IntersectionObserver,
          );
        }
        this.dispatchEvent(new Event("scrollend"));
      };

      if (holdScrolls) {
        pendingSettle = settle;
      } else {
        // RAC registers its listeners right after it scrolls, so everything follows asynchronously.
        pendingTimer = setTimeout(settle, 0);
      }
    },
    writable: true,
  });
  // The dialog is on screen once its scroll has settled at the entered position, and off it after.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
    this: HTMLElement,
  ) {
    const onScreen = this.dataset["slot"] === "sheet-dialog" && panelVisible;

    return {
      bottom: onScreen ? 400 : 0,
      height: onScreen ? 400 : 0,
      left: 0,
      right: onScreen ? 300 : 0,
      top: 0,
      width: onScreen ? 300 : 0,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
}

function removeSheetGeometry() {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
}

const SheetExample = ({
  defaultOpen,
  isDismissable,
  isOpen,
  onAnimationEnd,
  onClose,
  onOpenChange,
  placement,
  snapPoints,
}: {
  defaultOpen?: boolean;
  isDismissable?: boolean;
  isOpen?: boolean;
  onAnimationEnd?: (open: boolean) => void;
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
    onAnimationEnd={onAnimationEnd}
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
    resetSheetGeometry();
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

  describe("scrollSheetTo", () => {
    const scrollerWith = () => {
      const scroller = document.createElement("div");
      const scrollTo = vi.fn();

      scroller.scrollTo = scrollTo;

      return {scrollTo, scroller};
    };

    it("scrolls the vertical axis with top and the horizontal one with left", () => {
      const vertical = scrollerWith();
      const horizontal = scrollerWith();

      scrollSheetTo(vertical.scroller, "y", 120, false);
      scrollSheetTo(horizontal.scroller, "x", 80, false);

      expect(vertical.scrollTo).toHaveBeenCalledWith({behavior: "smooth", top: 120});
      expect(horizontal.scrollTo).toHaveBeenCalledWith({behavior: "smooth", left: 80});
    });

    it("uses behavior auto, not instant, under reduced motion", () => {
      const {scrollTo, scroller} = scrollerWith();

      scrollSheetTo(scroller, "y", 120, true);

      expect(scrollTo).toHaveBeenCalledWith({behavior: "auto", top: 120});
    });
  });

  describe("sheet-scroll geometry", () => {
    const rect = (top: number, bottom: number, left = 0, right = 0) =>
      ({bottom, height: bottom - top, left, right, top, width: right - left}) as DOMRect;

    it("finds the nearest scroller and nothing outside one", () => {
      const scroller = document.createElement("div");
      const inner = document.createElement("span");

      scroller.setAttribute("data-sheet-scroll", "");
      scroller.append(inner);

      expect(getSheetScroller(inner)).toBe(scroller);
      expect(getSheetScroller(document.createElement("div"))).toBeNull();
    });

    it("lists snap targets ascending and without duplicates", () => {
      const scroller = document.createElement("div");
      const markers = [300, 100, 300, 200].map((top) => {
        const marker = document.createElement("div");

        marker.style.scrollSnapAlign = "start";
        marker.getBoundingClientRect = () => rect(top, top + 10);
        scroller.append(marker);

        return marker;
      });
      const plain = document.createElement("div");

      scroller.getBoundingClientRect = () => rect(0, 500);
      scroller.append(plain);

      expect(markers).toHaveLength(4);
      expect(getSheetSnapTargets(scroller, "y")).toEqual([100, 200, 300]);
    });

    it("computes the start and end alignment of a marker", () => {
      const scroller = document.createElement("div");
      const marker = document.createElement("div");

      scroller.getBoundingClientRect = () => rect(10, 410);
      marker.getBoundingClientRect = () => rect(110, 210);
      Object.defineProperty(scroller, "clientHeight", {value: 400});
      Object.defineProperty(scroller, "scrollTop", {value: 50});

      expect(snapScrollPosition(scroller, marker, "y", "start")).toBe(150);
      expect(snapScrollPosition(scroller, marker, "y", "end")).toBe(-150);
    });
  });

  describe("lifecycle", () => {
    const EXIT_PARTS = ["sheet-overlay", "sheet-backdrop", "sheet-content", "sheet-dialog"];
    const part = (slot: string) => document.querySelector(`[data-slot="${slot}"]`);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

    /** A controlled sheet with a Trigger, so the owner can flip `isOpen` at any moment. */
    const Controlled = ({
      isOpen,
      onAnimationEnd,
    }: {
      isOpen: boolean;
      onAnimationEnd?: (open: boolean) => void;
    }) => (
      <Sheet isOpen={isOpen} onAnimationEnd={onAnimationEnd}>
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
      </Sheet>
    );

    it("calls onAnimationEnd(true) once after the enter settles", async () => {
      const onAnimationEnd = vi.fn();

      holdScrolls = true;
      render(<SheetExample onAnimationEnd={onAnimationEnd} />);
      await openSheet(user);

      // The enter scroll is still running: nothing has settled yet.
      expect(onAnimationEnd).not.toHaveBeenCalled();

      flushScrolls();
      await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true));
      await settle();

      expect(onAnimationEnd.mock.calls).toEqual([[true]]);
    });

    it("ignores a scroll that ends short of the requested state", async () => {
      const onAnimationEnd = vi.fn();
      const endScroll = () =>
        act(() => {
          document.querySelector("[data-sheet-scroll]")?.dispatchEvent(new Event("scrollend"));
        });

      holdScrolls = true;
      render(<SheetExample onAnimationEnd={onAnimationEnd} />);
      await openSheet(user);

      // An interrupted enter: the scroll ends while the panel is still off screen.
      endScroll();
      expect(onAnimationEnd).not.toHaveBeenCalled();

      flushScrolls();
      await waitFor(() => expect(onAnimationEnd.mock.calls).toEqual([[true]]));

      // An interrupted exit: the scroll ends while the panel is still on screen.
      await user.keyboard("{Escape}");
      endScroll();
      expect(onAnimationEnd.mock.calls).toEqual([[true]]);

      flushScrolls();
      await waitFor(() => expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]));
    });

    it("calls onAnimationEnd(false) once after exit", async () => {
      const onAnimationEnd = vi.fn();

      render(<SheetExample onAnimationEnd={onAnimationEnd} />);
      await openSheet(user);
      await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true));

      holdScrolls = true;
      await user.keyboard("{Escape}");

      // The exit scroll is still running: the close has not been reported.
      expect(onAnimationEnd.mock.calls).toEqual([[true]]);

      flushScrolls();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await settle();

      expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]);
    });

    it("calls onAnimationEnd(true) for a sheet that is open at mount", async () => {
      const onAnimationEnd = vi.fn();

      render(<SheetExample defaultOpen onAnimationEnd={onAnimationEnd} />);

      await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true));
      await settle();

      expect(onAnimationEnd.mock.calls).toEqual([[true]]);
    });

    it("toggling isOpen true, false, true quickly ends open and interactive, with no stale report", async () => {
      const onAnimationEnd = vi.fn();
      const {rerender} = render(<Controlled isOpen={false} onAnimationEnd={onAnimationEnd} />);

      rerender(<Controlled isOpen onAnimationEnd={onAnimationEnd} />);
      rerender(<Controlled isOpen={false} onAnimationEnd={onAnimationEnd} />);
      rerender(<Controlled isOpen onAnimationEnd={onAnimationEnd} />);

      const dialog = await screen.findByRole("dialog", {name: "Title"});

      await settle();

      // Final state is open: the dialog is reachable, the page behind is hidden, and nothing that
      // closed was ever reported after the last change.
      expect(dialog).toBeVisible();
      expect(dialog.closest("[inert]")).toBeNull();
      expect(dialog.closest("[aria-hidden='true']")).toBeNull();
      expect(screen.queryByRole("button", {name: "Open"})).toBeNull();
      expect(onAnimationEnd.mock.calls.at(-1)).toEqual([true]);
      expect(onAnimationEnd).not.toHaveBeenCalledWith(false);
    });

    it("toggling isOpen true, false quickly ends closed, releases the page and reports false once", async () => {
      const onAnimationEnd = vi.fn();
      const {rerender} = render(<Controlled isOpen={false} onAnimationEnd={onAnimationEnd} />);

      rerender(<Controlled isOpen onAnimationEnd={onAnimationEnd} />);
      rerender(<Controlled isOpen={false} onAnimationEnd={onAnimationEnd} />);

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await settle();

      // The page is interactive again: nothing stayed inert or aria-hidden.
      expect(screen.getByRole("button", {name: "Open"})).toBeInTheDocument();
      expect(document.querySelector("[inert]")).toBeNull();
      expect(document.querySelector("[aria-hidden='true']")).toBeNull();
      expect(onAnimationEnd.mock.calls.filter(([open]) => open === false)).toHaveLength(1);
      expect(onAnimationEnd.mock.calls.at(-1)).toEqual([false]);
    });

    it("rapid close then reopen keeps focus return on the Trigger", async () => {
      const {rerender} = render(<Controlled isOpen={false} />);

      await user.click(screen.getByRole("button", {name: "Open"}));
      rerender(<Controlled isOpen />);
      await screen.findByRole("dialog");
      await settle();

      holdScrolls = true;
      rerender(<Controlled isOpen={false} />);
      rerender(<Controlled isOpen />);
      holdScrolls = false;
      await settle();

      expect(await screen.findByRole("dialog")).toBeInTheDocument();

      rerender(<Controlled isOpen={false} />);

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(screen.getByRole("button", {name: "Open"})).toHaveFocus());
    });

    it("sets data-exiting on Backdrop, Content and Dialog during exit and not while open", async () => {
      render(<SheetExample defaultOpen />);
      await screen.findByRole("dialog");
      await settle();

      for (const slot of EXIT_PARTS) {
        expect(part(slot), slot).not.toHaveAttribute("data-exiting");
      }

      holdScrolls = true;
      await user.keyboard("{Escape}");

      for (const slot of EXIT_PARTS) {
        expect(part(slot), slot).toHaveAttribute("data-exiting");
      }

      flushScrolls();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("hands isExiting to the render-prop children of Backdrop, Content and Dialog", async () => {
      render(
        <Sheet defaultOpen>
          <Sheet.Backdrop>
            {({isExiting}) => (
              <Sheet.Content>
                {(content) => (
                  <Sheet.Dialog>
                    {(dialog) => (
                      <p data-testid="flags">
                        {`${isExiting}/${content.isExiting}/${dialog.isExiting}`}
                      </p>
                    )}
                  </Sheet.Dialog>
                )}
              </Sheet.Content>
            )}
          </Sheet.Backdrop>
        </Sheet>,
      );
      await screen.findByRole("dialog");
      await settle();

      expect(screen.getByTestId("flags")).toHaveTextContent("false/false/false");

      holdScrolls = true;
      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.getByTestId("flags")).toHaveTextContent("true/true/true"));

      flushScrolls();
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    describe("programmatic scrolls", () => {
      /*
       * RAC skips the exit scroll when it misjudges visibility at a partial detent, leaving the
       * closed panel on screen. The lifecycle then scrolls it away itself: that is the scroll whose
       * behavior the reduced-motion preference decides. The stub swallows RAC's own exit scroll to
       * reach that path.
       */
      const closeWithoutRacExit = async () => {
        render(<SheetExample defaultOpen />);
        await screen.findByRole("dialog");
        await settle();

        swallowScrolls = true;
        scrollCalls.length = 0;
        await user.keyboard("{Escape}");
        // RAC's own exit scroll is the first call; the lifecycle's follows after the panel sits still.
        await waitFor(() => expect(scrollCalls.length).toBeGreaterThan(1), {timeout: 2000});
      };

      it("reduced motion: with matchMedia matching, programmatic scroll uses behavior auto", async () => {
        vi.stubGlobal("matchMedia", (query: string) => ({
          addEventListener() {},
          addListener() {},
          matches: true,
          media: query,
          removeEventListener() {},
          removeListener() {},
        }));
        await closeWithoutRacExit();

        expect(scrollCalls.at(-1)).toMatchObject({behavior: "auto"});
      });

      it("scrolls smoothly when reduced motion is not requested", async () => {
        await closeWithoutRacExit();

        expect(scrollCalls.at(-1)).toMatchObject({behavior: "smooth"});
      });
    });

    describe("cleanup", () => {
      it("cancels its frame loop and its listener when the sheet unmounts", async () => {
        const cancel = vi.spyOn(window, "cancelAnimationFrame");
        const request = vi.spyOn(window, "requestAnimationFrame");
        const {unmount} = render(<SheetExample defaultOpen />);

        await screen.findByRole("dialog");
        await settle();

        swallowScrolls = true;
        await user.keyboard("{Escape}");
        await waitFor(() => expect(request).toHaveBeenCalled());

        const scroller = document.querySelector("[data-sheet-scroll]") as HTMLElement;
        const remove = vi.spyOn(scroller, "removeEventListener");

        unmount();

        expect(remove).toHaveBeenCalledWith("scrollend", expect.any(Function));
        expect(cancel).toHaveBeenCalled();
      });
    });
  });

  // Pinned in later tasks.
  it.todo("operates the handle as a slider (Task 6)");
  it.todo("drags the handle and settles on snap points (Task 7)");
  it.todo("stacks nested sheets and closes the topmost first (Task 8)");
});

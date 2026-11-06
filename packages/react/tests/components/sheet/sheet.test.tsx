import {act, cleanup, fireEvent, render, screen, setupUser, waitFor} from "@peakui/testing/helpers";
import {createRef, useState} from "react";
import {I18nProvider} from "react-aria-components/I18nProvider";

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
  isSheetPanelOnScreen,
  measureSheet,
  scrollSheetTo,
  snapScrollPosition,
  writeSheetScroll,
} from "@/components/sheet/sheet-scroll.ts";
import {isUsableSnapPoint, resolveSheetPositions} from "@/components/sheet/use-sheet-handle.ts";

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
 * browser, a new scroll supersedes the one in flight: only the last one settles. `visibleScrollers`
 * holds the scrollers whose panel is on screen; a dialog's rect reports from it, so the lifecycle's
 * geometry check sees the settled position of its own sheet. It is per scroller because a stacked
 * child's exit must not move its parent's panel.
 */
const visibleScrollers = new Set<Element>();
let holdScrolls = false;
let swallowScrolls = false;
let dropScrollEnd = false;
let pendingSettle: (() => void) | null = null;
let pendingTimer: ReturnType<typeof setTimeout> | undefined;
const scrollCalls: ScrollToOptions[] = [];

function resetSheetGeometry() {
  clearTimeout(pendingTimer);
  pendingSettle = null;
  visibleScrollers.clear();
  holdScrolls = false;
  swallowScrolls = false;
  dropScrollEnd = false;
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

      // A new scroll cancels the one in flight, as a browser's does; one that is not superseded
      // still completes, whether it is held for the test to flush or runs on a timer.
      clearTimeout(pendingTimer);
      pendingSettle = null;

      const settle = () => {
        pendingSettle = null;
        if (exited) visibleScrollers.delete(this);
        else visibleScrollers.add(this);
        Object.defineProperty(this, request.top === undefined ? "scrollLeft" : "scrollTop", {
          configurable: true,
          value: target,
          writable: true,
        });
        for (const {callback, element} of observers) {
          // Only the panel of the scroller that scrolled moves: a stacked sheet's parent stays put.
          if (!this.contains(element)) continue;
          callback(
            [{intersectionRatio: exited ? 0 : 1, target: element} as IntersectionObserverEntry],
            {} as IntersectionObserver,
          );
        }
        // Some browsers have no scrollend, and a scroll to where it already is ends none.
        if (!dropScrollEnd) this.dispatchEvent(new Event("scrollend"));
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
    const isDialog = this.dataset["slot"] === "sheet-dialog";
    const scroller = this.closest("[data-sheet-scroll]");
    const onScreen = isDialog && !!scroller && visibleScrollers.has(scroller);

    return {
      // Any other element ends at the viewport's height: that is where a bottom sheet's end
      // marker puts the entered scroll position, so a restore computes a real (non-zero) target.
      bottom: onScreen ? 400 : isDialog ? 0 : 768,
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

    describe("measureSheet and writeSheetScroll", () => {
      const scrollerWithDialog = (dialogRect: DOMRect, clientLength = 0) => {
        const scroller = document.createElement("div");
        const dialog = document.createElement("div");

        dialog.setAttribute("data-slot", "sheet-dialog");
        dialog.getBoundingClientRect = () => dialogRect;
        Object.defineProperty(dialog, "clientHeight", {value: clientLength});
        Object.defineProperty(dialog, "clientWidth", {value: clientLength});
        Object.defineProperty(scroller, "scrollHeight", {value: 1400});
        Object.defineProperty(scroller, "clientHeight", {value: 700});
        Object.defineProperty(scroller, "scrollWidth", {value: 1000});
        Object.defineProperty(scroller, "clientWidth", {value: 400});
        scroller.append(dialog);

        return scroller;
      };

      it("measures the extent, the dialog's size and the viewport along each axis", () => {
        const scroller = scrollerWithDialog(rect(0, 320, 0, 280));

        expect(measureSheet(scroller, "y")).toEqual({
          extent: 700,
          size: 320,
          viewport: window.innerHeight,
        });
        expect(measureSheet(scroller, "x")).toEqual({
          extent: 600,
          size: 280,
          viewport: window.innerWidth,
        });
      });

      it("falls back to the dialog's client size when its rect is empty, and to 0 without a dialog", () => {
        const scroller = scrollerWithDialog(rect(0, 0), 150);

        expect(measureSheet(scroller, "y").size).toBe(150);
        expect(measureSheet(scroller, "x").size).toBe(150);
        expect(measureSheet(document.createElement("div"), "y").size).toBe(0);
      });

      it("writes the position to scrollTop on y and to scrollLeft on x", () => {
        const scroller = document.createElement("div");
        const top = vi.fn();
        const left = vi.fn();

        Object.defineProperty(scroller, "scrollTop", {configurable: true, set: top});
        Object.defineProperty(scroller, "scrollLeft", {configurable: true, set: left});

        writeSheetScroll(scroller, "y", 12);
        writeSheetScroll(scroller, "x", 34);

        expect(top).toHaveBeenCalledExactlyOnceWith(12);
        expect(left).toHaveBeenCalledExactlyOnceWith(34);
      });
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
      onOpenChange,
    }: {
      isOpen: boolean;
      onAnimationEnd?: (open: boolean) => void;
      onOpenChange?: (open: boolean) => void;
    }) => (
      <Sheet isOpen={isOpen} onAnimationEnd={onAnimationEnd} onOpenChange={onOpenChange}>
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

    describe("settle check", () => {
      it("reports onAnimationEnd(true) exactly once when scrollend never fires", async () => {
        const onAnimationEnd = vi.fn();

        dropScrollEnd = true;
        render(<SheetExample onAnimationEnd={onAnimationEnd} />);
        await openSheet(user);

        await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true), {timeout: 2000});
        await settle();

        expect(onAnimationEnd.mock.calls).toEqual([[true]]);
      });

      it("reports onAnimationEnd(true) for a sheet open at mount without scrollend", async () => {
        const onAnimationEnd = vi.fn();

        dropScrollEnd = true;
        render(<SheetExample defaultOpen onAnimationEnd={onAnimationEnd} />);

        await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true), {timeout: 2000});
        await settle();

        expect(onAnimationEnd.mock.calls).toEqual([[true]]);
      });

      it("reports the exit once when scrollend never fires", async () => {
        const onAnimationEnd = vi.fn();

        dropScrollEnd = true;

        // Closed by the owner: without scrollend the enter never resolves, so focus has not moved
        // into the dialog and Escape would not reach it.
        const {rerender} = render(<Controlled isOpen onAnimationEnd={onAnimationEnd} />);

        await waitFor(() => expect(onAnimationEnd).toHaveBeenCalledWith(true), {timeout: 2000});

        rerender(<Controlled isOpen={false} onAnimationEnd={onAnimationEnd} />);

        await waitFor(() => expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]), {
          timeout: 2000,
        });
        await settle();

        expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]);
      });

      it("reports nothing while an interrupted scroll never reaches the panel", async () => {
        const onAnimationEnd = vi.fn();

        holdScrolls = true;
        render(<SheetExample onAnimationEnd={onAnimationEnd} />);
        await openSheet(user);

        // Many frames pass with the scroller standing still and the panel still off screen.
        await new Promise((resolve) => setTimeout(resolve, 150));

        expect(onAnimationEnd).not.toHaveBeenCalled();
      });

      it("stops checking when the sheet unmounts mid-enter", async () => {
        const cancel = vi.spyOn(window, "cancelAnimationFrame");
        const onAnimationEnd = vi.fn();

        holdScrolls = true;

        const {unmount} = render(<SheetExample onAnimationEnd={onAnimationEnd} />);

        await openSheet(user);
        await new Promise((resolve) => setTimeout(resolve, 50));
        cancel.mockClear();

        unmount();

        expect(cancel).toHaveBeenCalled();
        expect(onAnimationEnd).not.toHaveBeenCalled();
      });
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
      expect(onAnimationEnd.mock.calls).toEqual([[true]]);
    });

    // The flips happen before any scroll starts, so this covers the state machine and the
    // release of the page, not the scroll path (see the held-scroll tests below for that).
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
      expect(onAnimationEnd.mock.calls).toEqual([[false]]);
    });

    it("rapid close then reopen cancels the exit in flight and keeps focus return on the Trigger", async () => {
      const onAnimationEnd = vi.fn();
      const onOpenChange = vi.fn();
      const props = {onAnimationEnd, onOpenChange};
      const {rerender} = render(<Controlled isOpen={false} {...props} />);

      await user.click(screen.getByRole("button", {name: "Open"}));
      rerender(<Controlled isOpen {...props} />);
      await screen.findByRole("dialog");
      await waitFor(() => expect(onAnimationEnd.mock.calls).toEqual([[true]]));
      onOpenChange.mockClear();

      // The exit scroll starts and is still in flight when the owner reopens the sheet.
      holdScrolls = true;
      rerender(<Controlled isOpen={false} {...props} />);
      const exitScroll = scrollCalls.length;

      rerender(<Controlled isOpen {...props} />);

      // The reopen sent the scroller back to rest, replacing the exit scroll.
      expect(scrollCalls.length).toBeGreaterThan(exitScroll);
      expect(scrollCalls.at(-1)).toMatchObject({behavior: "smooth", top: 768});

      // Letting whatever is still in flight finish must not close the sheet the owner reopened.
      holdScrolls = false;
      flushScrolls();
      await settle();

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      // Open was reported once: an exit that never completed is not a second settled state.
      expect(onAnimationEnd.mock.calls).toEqual([[true]]);

      rerender(<Controlled isOpen={false} {...props} />);

      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(screen.getByRole("button", {name: "Open"})).toHaveFocus());
      expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]);
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

    /*
     * Backdrop and Dialog are wired by this library; Content is the primitive's own modal element,
     * which sets data-exiting and passes isExiting to its className and children functions. The
     * Content assertions pin that wiring through our component, they do not test code of ours.
     */
    it("hands isExiting to the render-prop children of Backdrop, Content and Dialog", async () => {
      render(
        <Sheet defaultOpen>
          <Sheet.Backdrop>
            {({isExiting}) => (
              <Sheet.Content className={(content) => (content.isExiting ? "is-out" : "is-in")}>
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
      expect(part("sheet-content")).toHaveClass("is-in");

      holdScrolls = true;
      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.getByTestId("flags")).toHaveTextContent("true/true/true"));
      expect(part("sheet-content")).toHaveClass("is-out");
      expect(part("sheet-content")).toHaveAttribute("data-exiting");

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

        const remove = vi.spyOn(document, "removeEventListener");

        unmount();

        expect(remove).toHaveBeenCalledWith("scrollend", expect.any(Function), true);
        expect(cancel).toHaveBeenCalled();
      });

      it("reports the closed state on unmount even if the scroller was never settled", async () => {
        const onAnimationEnd = vi.fn();
        const {unmount} = render(<SheetExample defaultOpen onAnimationEnd={onAnimationEnd} />);

        await waitFor(() => expect(onAnimationEnd.mock.calls).toEqual([[true]]));

        swallowScrolls = true;
        await user.keyboard("{Escape}");
        unmount();

        expect(onAnimationEnd.mock.calls).toEqual([[true], [false]]);
      });
    });
  });

  /*
   * jsdom has no layout. These tests give the sheet's snap markers a scripted geometry and the
   * scroller a scripted scroll position, so they prove the slider's semantics, stepping arithmetic
   * and wiring; the browser tier (Task 10) proves the same against real layout and real scrolling.
   */
  describe("handle", () => {
    const scroll = {x: 300, y: 300};
    let targets = [0, 300, 600];
    const snapElements = () =>
      [...document.querySelectorAll<HTMLElement>("[data-sheet-scroll] *")].filter(
        (element) => element.style.scrollSnapAlign,
      );
    const slider = () => screen.getByRole("slider");
    const scroller = () => document.querySelector<HTMLElement>("[data-sheet-scroll]")!;
    /** Reports a scroll to the slider, as the browser's scroll event does. */
    const scrollTo = (axis: "x" | "y", value: number, type = "scroll") => {
      scroll[axis] = value;
      act(() => {
        scroller().dispatchEvent(new Event(type));
      });
    };

    beforeEach(() => {
      scroll.x = 300;
      scroll.y = 300;
      targets = [0, 300, 600];
      // RAC's own scrolls are recorded but go nowhere: the scripted scroll is the only position.
      swallowScrolls = true;
      Object.defineProperty(HTMLElement.prototype, "scrollTop", {
        configurable: true,
        get: () => scroll.y,
        set: () => {},
      });
      Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
        configurable: true,
        get: () => scroll.x,
        set: () => {},
      });

      const previous = vi
        .mocked(HTMLElement.prototype.getBoundingClientRect)
        .getMockImplementation();

      // A marker's rect is where it would sit for the current scroll: target minus the scroll.
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
        this: HTMLElement,
      ) {
        const index = snapElements().indexOf(this);
        const target = targets[index];

        if (index >= 0 && target !== undefined) {
          // The adapter honours the marker's scroll-margin, as the browser's snapping does, so
          // the marker sits where that margin puts it relative to the target.
          const style = getComputedStyle(this);
          const margin = (value: string) => parseFloat(value) || 0;
          const atEnd = this.style.scrollSnapAlign === "end";
          const top = target - scroll.y + (atEnd ? 0 : margin(style.scrollMarginTop));
          const bottom = target - scroll.y - (atEnd ? margin(style.scrollMarginBottom) : 0);
          const left = target - scroll.x + (atEnd ? 0 : margin(style.scrollMarginLeft));
          const right = target - scroll.x - (atEnd ? margin(style.scrollMarginRight) : 0);

          return {bottom, height: 0, left, right, top, width: 0, x: left, y: top} as DOMRect;
        }

        return previous!.call(this);
      });
    });

    afterEach(() => {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTop");
      Reflect.deleteProperty(HTMLElement.prototype, "scrollLeft");
    });

    const HandleSheet = ({
      handleProps,
      isDismissable,
      onOpenChange,
      placement,
      snapPoints = [0.5],
      withBody = false,
    }: {
      handleProps?: React.ComponentProps<typeof Sheet.Handle>;
      isDismissable?: boolean;
      onOpenChange?: (open: boolean) => void;
      placement?: Placement;
      /** `null` renders a sheet with no snap points at all. */
      snapPoints?: Array<number | string> | null;
      withBody?: boolean;
    }) => (
      <Sheet
        defaultOpen
        isDismissable={isDismissable}
        placement={placement}
        snapPoints={snapPoints ?? undefined}
        onOpenChange={onOpenChange}
      >
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog>
              <Sheet.Handle {...handleProps} />
              <Sheet.Heading>Title</Sheet.Heading>
              {withBody ? (
                <Sheet.Body>
                  <p data-testid="body-child">Body</p>
                </Sheet.Body>
              ) : null}
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    );

    it("is a slider with orientation, min, max, now and text when snap points exist", async () => {
      render(<HandleSheet />);
      await screen.findByRole("dialog");

      expect(getSheetSnapTargets(scroller(), "y")).toEqual([0, 300, 600]);
      expect(slider()).toHaveAttribute("aria-orientation", "vertical");
      expect(slider()).toHaveAttribute("aria-valuemin", "50");
      expect(slider()).toHaveAttribute("aria-valuemax", "100");
      expect(slider()).toHaveAttribute("aria-valuenow", "50");
      expect(slider()).toHaveAttribute("aria-valuetext", "Half height");
      expect(slider()).toHaveAttribute("tabindex", "0");
      expect(slider()).toHaveAccessibleName();
    });

    it("horizontal placement reports aria-orientation horizontal", async () => {
      render(<HandleSheet placement="right" />);
      await screen.findByRole("dialog");

      expect(slider()).toHaveAttribute("aria-orientation", "horizontal");
      expect(slider()).toHaveAttribute("aria-valuenow", "50");
    });

    it("ArrowUp steps to the next snap and ArrowDown back; Home and End jump to the extremes", async () => {
      render(<HandleSheet />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowUp}");
      expect(scrollCalls).toEqual([{behavior: "smooth", top: 600}]);

      scrollTo("y", 600);
      expect(slider()).toHaveAttribute("aria-valuenow", "100");
      expect(slider()).toHaveAttribute("aria-valuetext", "Full height");

      scrollCalls.length = 0;
      await user.keyboard("{ArrowDown}");
      expect(scrollCalls).toEqual([{behavior: "smooth", top: 300}]);

      scrollTo("y", 300);
      expect(slider()).toHaveAttribute("aria-valuenow", "50");

      scrollCalls.length = 0;
      await user.keyboard("{End}");
      scrollTo("y", 600);
      await user.keyboard("{Home}");

      expect(scrollCalls).toEqual([
        {behavior: "smooth", top: 600},
        {behavior: "smooth", top: 300},
      ]);
    });

    it("steps to the nearest position when the scroll is between two", async () => {
      targets = [0, 150, 300, 600];
      render(<HandleSheet snapPoints={[0.25, 0.5]} />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollTo("y", 400);
      scrollCalls.length = 0;

      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowUp}");

      expect(scrollCalls).toEqual([
        {behavior: "smooth", top: 300},
        {behavior: "smooth", top: 600},
      ]);
    });

    it("reads a top sheet's reveal from the far edge", async () => {
      // A top sheet is open at scroll 0 and closed at the far edge: 150 shows 75% of 600.
      scroll.y = 150;
      render(<HandleSheet placement="top" />);
      await screen.findByRole("dialog");

      expect(slider()).toHaveAttribute("aria-valuenow", "75");
      expect(slider()).toHaveAttribute("aria-valuetext", "Three-quarter height");
    });

    it("RTL horizontal: ArrowLeft increases and ArrowRight decreases", async () => {
      render(
        <I18nProvider locale="ar-EG">
          <HandleSheet placement="right" />
        </I18nProvider>,
      );
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowLeft}");
      expect(scrollCalls).toEqual([{behavior: "smooth", left: 600}]);

      scrollTo("x", 600);
      scrollCalls.length = 0;
      await user.keyboard("{ArrowRight}");
      expect(scrollCalls).toEqual([{behavior: "smooth", left: 300}]);
    });

    it("LTR horizontal: ArrowRight increases and ArrowLeft decreases", async () => {
      render(<HandleSheet placement="right" />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowRight}");
      expect(scrollCalls).toEqual([{behavior: "smooth", left: 600}]);

      scrollTo("x", 600);
      scrollCalls.length = 0;
      await user.keyboard("{ArrowLeft}");
      expect(scrollCalls).toEqual([{behavior: "smooth", left: 300}]);
    });

    it("RTL does not swap the arrows of a vertical sheet", async () => {
      render(
        <I18nProvider locale="ar-EG">
          <HandleSheet />
        </I18nProvider>,
      );
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowUp}");
      expect(scrollCalls).toEqual([{behavior: "smooth", top: 600}]);
    });

    it("Escape on the focused handle closes the sheet", async () => {
      const onOpenChange = vi.fn();

      render(<HandleSheet onOpenChange={onOpenChange} />);
      await screen.findByRole("dialog");
      act(() => slider().focus());

      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("with no snapPoints the handle is aria-hidden and not a slider", async () => {
      render(<HandleSheet snapPoints={[]} />);
      await screen.findByRole("dialog");

      expect(screen.queryByRole("slider")).toBeNull();
      expect(document.querySelector("[data-sheet-handle]")).toHaveAttribute("aria-hidden", "true");
      expect(document.querySelector("[data-sheet-handle]")).not.toHaveAttribute("tabindex");
    });

    it("ignores snap points that cannot describe a position", async () => {
      render(<HandleSheet snapPoints={["abc", "0px", "0%", "-5px"]} />);
      await screen.findByRole("dialog");

      expect(screen.queryByRole("slider")).toBeNull();
    });

    it("ArrowDown at the lowest snap and ArrowUp at full do nothing", async () => {
      render(<HandleSheet />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowDown}");
      expect(scrollCalls).toEqual([]);

      scrollTo("y", 600);
      await user.keyboard("{ArrowUp}");
      expect(scrollCalls).toEqual([]);
    });

    it("a step past the lowest point does not dismiss the sheet", async () => {
      const onOpenChange = vi.fn();

      render(<HandleSheet onOpenChange={onOpenChange} />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      await user.keyboard("{ArrowDown}{ArrowDown}{Home}");

      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("zero-size layout never renders NaN in aria-valuenow", async () => {
      targets = [0, 0, 0];
      scroll.y = 0;
      render(<HandleSheet />);
      await screen.findByRole("dialog");
      scrollTo("y", 0, "scrollend");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowUp}{ArrowDown}{Home}{End}");

      expect(slider()).not.toHaveAttribute("aria-valuenow");
      expect(document.body.innerHTML).not.toContain("NaN");
      expect(scrollCalls).toEqual([]);
    });

    it("a single resting position leaves the arrows inert and the value steady", async () => {
      targets = [0, 600, 600];
      scroll.y = 600;
      render(<HandleSheet />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowUp}{ArrowDown}{Home}{End}");

      expect(slider()).toHaveAttribute("aria-valuenow", "100");
      expect(scrollCalls).toEqual([]);
    });

    it("re-measures on scrollend and reports an in-between scroll as its own percentage", async () => {
      render(<HandleSheet />);
      await screen.findByRole("dialog");

      scrollTo("y", 450, "scrollend");

      expect(slider()).toHaveAttribute("aria-valuenow", "75");
      expect(slider()).toHaveAttribute("aria-valuetext", "Three-quarter height");

      scrollTo("y", 330);

      expect(slider()).toHaveAttribute("aria-valuenow", "55");
      expect(slider()).toHaveAttribute("aria-valuetext", "55% height");
    });

    it("clamps a scroll below the lowest snap to the minimum", async () => {
      render(<HandleSheet />);
      await screen.findByRole("dialog");

      scrollTo("y", 30);

      expect(slider()).toHaveAttribute("aria-valuenow", "50");
    });

    it("stops listening to the scroller when it unmounts", async () => {
      const added: Array<[string, unknown]> = [];
      const removed: Array<[string, unknown]> = [];
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      const isScroller = (target: unknown) =>
        target instanceof HTMLElement && target.hasAttribute("data-sheet-scroll");

      vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
        this: EventTarget,
        ...args: Parameters<typeof originalAdd>
      ) {
        // The primitive's own one-shot waits clean themselves up; only persistent listeners count.
        const once = typeof args[2] === "object" && args[2] !== null && args[2].once === true;

        if (isScroller(this) && !once && (args[0] === "scroll" || args[0] === "scrollend")) {
          added.push([args[0], args[1]]);
        }

        return originalAdd.apply(this, args);
      });
      vi.spyOn(EventTarget.prototype, "removeEventListener").mockImplementation(function (
        this: EventTarget,
        ...args: Parameters<typeof originalRemove>
      ) {
        if (isScroller(this) && (args[0] === "scroll" || args[0] === "scrollend")) {
          removed.push([args[0], args[1]]);
        }

        return originalRemove.apply(this, args);
      });

      const {unmount} = render(<HandleSheet />);

      await screen.findByRole("dialog");
      unmount();

      // Every listener added to the scroller (the handle's included) is removed again, each once.
      expect(added.length).toBeGreaterThanOrEqual(2);
      for (const [type, listener] of added) {
        expect(removed.filter(([t, l]) => t === type && l === listener)).toHaveLength(
          added.filter(([t, l]) => t === type && l === listener).length,
        );
      }
    });

    it("a consumer aria-valuetext overrides the default", async () => {
      render(<HandleSheet handleProps={{"aria-valuetext": "Peek"}} />);
      await screen.findByRole("dialog");

      expect(slider()).toHaveAttribute("aria-valuetext", "Peek");
    });

    it("chains a consumer onKeyDown with the stepping", async () => {
      const onKeyDown = vi.fn();

      render(<HandleSheet handleProps={{onKeyDown}} />);
      await screen.findByRole("dialog");
      act(() => slider().focus());
      scrollCalls.length = 0;

      await user.keyboard("{ArrowUp}");

      expect(onKeyDown).toHaveBeenCalledTimes(1);
      expect(scrollCalls).toHaveLength(1);
    });

    it("the handle accepts className and ref", async () => {
      const ref = createRef<HTMLDivElement>();

      render(<HandleSheet handleProps={{className: "custom-handle", ref}} />);
      await screen.findByRole("dialog");

      expect(slider()).toHaveClass("custom-handle");
      expect(ref.current).toBe(slider());
      expect(slider()).toHaveAttribute("data-slot", "sheet-handle");
      expect(slider().querySelector('[data-slot="sheet-handle-bar"]')).not.toBeNull();
    });

    describe("resolveSheetPositions", () => {
      it("sorts, de-duplicates and drops zero, negative and non-finite sizes", () => {
        const {extent, positions} = resolveSheetPositions(
          [600, 0, Number.NaN, 300, 300.2, Number.POSITIVE_INFINITY, -40],
          true,
        );

        expect(extent).toBe(600);
        expect(positions).toEqual([
          {percent: 50, scroll: 300},
          {percent: 100, scroll: 600},
        ]);
      });

      it("measures a top or left sheet from the far edge", () => {
        const {positions} = resolveSheetPositions([0, 150, 600], false);

        expect(positions).toEqual([
          {percent: 75, scroll: 150},
          {percent: 100, scroll: 0},
        ]);
      });

      it("yields nothing for a zero-size layout", () => {
        expect(resolveSheetPositions([0, 0, 0], true).positions).toEqual([]);
        expect(resolveSheetPositions([], true).positions).toEqual([]);
        expect(resolveSheetPositions([Number.NaN], true).positions).toEqual([]);
      });

      it("accepts only snap points that can describe a position", () => {
        expect(isUsableSnapPoint(0.5)).toBe(true);
        expect(isUsableSnapPoint("320px")).toBe(true);
        expect(isUsableSnapPoint("40%")).toBe(true);
        expect(isUsableSnapPoint("calc(100% - 2rem)")).toBe(true);
        expect(isUsableSnapPoint("0px")).toBe(false);
        expect(isUsableSnapPoint("0%")).toBe(false);
        expect(isUsableSnapPoint("-10px")).toBe(false);
        expect(isUsableSnapPoint("tall")).toBe(false);
        expect(isUsableSnapPoint(Number.NaN)).toBe(false);
      });

      it("treats full-size points as no partial position", () => {
        expect(isUsableSnapPoint(1)).toBe(false);
        expect(isUsableSnapPoint("1")).toBe(false);
        expect(isUsableSnapPoint("100%")).toBe(false);
      });
    });

    describe("localization", () => {
      /** Moves the scripted scroll to a percentage of the 600 extent and reports it. */
      const showPercent = (percent: number) => scrollTo("y", (percent / 100) * 600, "scrollend");
      const renderAt = async (
        locale?: string,
        handleProps?: Parameters<typeof HandleSheet>[0]["handleProps"],
      ) => {
        // The sheet renders three markers (closed, partial, full): extent 600, lowest rest at 25%.
        targets = [0, 150, 600];
        const sheet = <HandleSheet handleProps={handleProps} />;

        render(locale ? <I18nProvider locale={locale}>{sheet}</I18nProvider> : sheet);
        await screen.findByRole("dialog");
      };

      it("speaks the default English height texts", async () => {
        await renderAt("en-US");

        for (const [percent, text] of [
          [25, "Quarter height"],
          [50, "Half height"],
          [75, "Three-quarter height"],
          [100, "Full height"],
          [62, "62% height"],
        ] as const) {
          showPercent(percent);
          expect(slider()).toHaveAttribute("aria-valuetext", text);
        }

        expect(slider()).toHaveAttribute("aria-label", "Resize sheet");
      });

      it("speaks Russian under ru-RU", async () => {
        await renderAt("ru-RU");

        expect(slider()).toHaveAttribute("aria-label", "Изменить размер панели");
        showPercent(25);
        expect(slider()).toHaveAttribute("aria-valuetext", "Четверть высоты");
        showPercent(62);
        expect(slider()).toHaveAttribute("aria-valuetext", "62% высоты");
      });

      it("falls back to English for an unsupported locale", async () => {
        await renderAt("de-DE");

        expect(slider()).toHaveAttribute("aria-label", "Resize sheet");
        showPercent(50);
        expect(slider()).toHaveAttribute("aria-valuetext", "Half height");
      });

      it("lets a consumer label and value text win under ru-RU", async () => {
        await renderAt("ru-RU", {"aria-label": "Высота", "aria-valuetext": "Peek"});

        expect(slider()).toHaveAttribute("aria-label", "Высота");
        expect(slider()).toHaveAttribute("aria-valuetext", "Peek");
      });
    });

    /*
     * jsdom has no layout, no real scroll-snap and no pointer capture. These tests script the
     * scroller (a `scrollTop`/`scrollLeft` setter that records the writes), the snap geometry and
     * the pointer sequence, so they prove the state machine: which target a release picks, when it
     * dismisses, and that nothing is left behind. That the scroller really follows the pointer, that
     * capture holds outside the handle, and that scroll-snap stays off during a drag is Task 10's
     * (Playwright) to verify.
     */
    describe("handle drag", () => {
      const writes: number[] = [];
      let captured: number[] = [];
      let released: number[] = [];

      /** Fires a pointer event at an element with a scripted pointer and time stamp. */
      const pointer = (
        type: "pointercancel" | "pointerdown" | "pointermove" | "pointerup",
        element: Element,
        {
          button = 0,
          id = 1,
          isPrimary = true,
          t = 0,
          x = 0,
          y = 0,
        }: {button?: number; id?: number; isPrimary?: boolean; t?: number; x?: number; y?: number},
      ) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          button,
          cancelable: true,
          clientX: x,
          clientY: y,
          isPrimary,
          pointerId: id,
        });

        // React falls back to the wall clock for a falsy time stamp, so zero is shifted to 1.
        Object.defineProperty(event, "timeStamp", {value: t + 1});
        // The stand-in PointerEvent of the test setup carries no isPrimary.
        Object.defineProperty(event, "isPrimary", {value: isPrimary});
        fireEvent(element, event);
      };
      const handle = () => document.querySelector<HTMLElement>("[data-sheet-handle]")!;
      const lostCapture = (id = 1) => {
        const event = new Event("lostpointercapture", {bubbles: true});

        Object.defineProperty(event, "pointerId", {value: id});
        fireEvent(handle(), event);
      };
      const reduceMotion = (reduced: boolean) =>
        vi.stubGlobal("matchMedia", (query: string) => ({
          addEventListener() {},
          addListener() {},
          matches: reduced,
          media: query,
          removeEventListener() {},
          removeListener() {},
        }));

      beforeEach(() => {
        writes.length = 0;
        captured = [];
        released = [];
        reduceMotion(true);
        // The scroller follows what is written to it, and every write is recorded.
        Object.defineProperty(HTMLElement.prototype, "scrollTop", {
          configurable: true,
          get: () => scroll.y,
          set: (value: number) => {
            writes.push(value);
            scroll.y = value;
          },
        });
        Object.defineProperty(HTMLElement.prototype, "scrollLeft", {
          configurable: true,
          get: () => scroll.x,
          set: (value: number) => {
            writes.push(value);
            scroll.x = value;
          },
        });
        // The scroll range is 600; the client size stays 0 (jsdom's) because the snap markers
        // aligned to the end subtract it from their positions.
        Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
          configurable: true,
          value: 600,
        });
        Object.defineProperty(HTMLElement.prototype, "scrollWidth", {
          configurable: true,
          value: 600,
        });
        Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
          configurable: true,
          value: (id: number) => captured.push(id),
        });
        Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
          configurable: true,
          value: (id: number) => captured.includes(id) && !released.includes(id),
        });
        Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
          configurable: true,
          value: (id: number) => released.push(id),
        });
      });

      afterEach(() => {
        vi.useRealTimers();
        for (const name of [
          "scrollHeight",
          "scrollWidth",
          "setPointerCapture",
          "hasPointerCapture",
          "releasePointerCapture",
        ]) {
          Reflect.deleteProperty(HTMLElement.prototype, name);
        }
      });

      it("dragging the handle scrolls the scroller by the pointer delta", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 500, y: 150});
        expect(writes.at(-1)).toBe(250);
        pointer("pointermove", handle(), {t: 1000, y: 60});
        expect(writes.at(-1)).toBe(340);
        expect(captured).toEqual([1]);
        expect(handle()).toHaveAttribute("data-dragging");
        expect(scroller()).toHaveAttribute("data-handle-dragging");
      });

      it("drags a horizontal sheet along x with clientX", async () => {
        render(<HandleSheet placement="right" />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, x: 100, y: 0});
        pointer("pointermove", handle(), {t: 500, x: 140, y: 999});

        expect(writes.at(-1)).toBe(260);
        expect(scroll.x).toBe(260);
        expect(scroll.y).toBe(300);
      });

      it("release settles on the nearest snap target and clears the drag attributes", async () => {
        const onOpenChange = vi.fn();

        render(<HandleSheet onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 180});
        pointer("pointerup", handle(), {t: 2000, y: 180});
        expect(writes.at(-1)).toBe(300);
        expect(handle()).not.toHaveAttribute("data-dragging");
        expect(scroller()).not.toHaveAttribute("data-handle-dragging");
        expect(released).toEqual([1]);

        pointer("pointerdown", handle(), {t: 3000, y: 100});
        pointer("pointermove", handle(), {t: 4000, y: -150});
        pointer("pointerup", handle(), {t: 5000, y: -150});
        expect(writes.at(-1)).toBe(600);
        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it("a fast flick settles on the next target in its direction", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        // 30px up in 20ms is a flick toward more of the sheet: 330 is nearer to 300, yet it goes
        // to 600.
        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 20, y: 70});
        pointer("pointerup", handle(), {t: 21, y: 70});

        expect(writes.at(-1)).toBe(600);
      });

      it("dragging past the lowest snap and releasing closes the sheet when dismissable", async () => {
        const onOpenChange = vi.fn();

        render(<HandleSheet onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 350});
        pointer("pointerup", handle(), {t: 2000, y: 350});

        expect(writes.at(-1)).toBe(0);
        expect(onOpenChange).toHaveBeenCalledTimes(1);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      it("a flick down from the lowest snap closes a dismissable sheet", async () => {
        const onOpenChange = vi.fn();

        render(<HandleSheet onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 20, y: 130});
        pointer("pointerup", handle(), {t: 21, y: 130});

        expect(writes.at(-1)).toBe(0);
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });

      it("isDismissable={false}: the same release settles and never calls onOpenChange(false)", async () => {
        const onOpenChange = vi.fn();

        render(<HandleSheet isDismissable={false} onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");

        // Past the lowest snap.
        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 350});
        pointer("pointerup", handle(), {t: 2000, y: 350});
        expect(writes.at(-1)).toBe(300);

        // A flick down from the lowest snap.
        pointer("pointerdown", handle(), {t: 3000, y: 100});
        pointer("pointermove", handle(), {t: 3020, y: 130});
        pointer("pointerup", handle(), {t: 3021, y: 130});
        expect(writes.at(-1)).toBe(300);

        expect(onOpenChange).not.toHaveBeenCalled();
      });

      describe("without snap points", () => {
        it("a fast flick toward the edge closes the sheet", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet snapPoints={null} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 20, y: 130});
          pointer("pointerup", handle(), {t: 21, y: 130});

          expect(writes.at(-1)).toBe(0);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("a short slow drag settles back where it started", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet snapPoints={null} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 2000, y: 110});
          pointer("pointerup", handle(), {t: 4000, y: 110});

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });

        it("isDismissable={false}: a flick settles and never closes", async () => {
          const onOpenChange = vi.fn();

          render(
            <HandleSheet isDismissable={false} snapPoints={null} onOpenChange={onOpenChange} />,
          );
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 20, y: 130});
          pointer("pointerup", handle(), {t: 21, y: 130});

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });
      });

      /*
       * Top and left sheets open at scroll 0 and close at the far end of the scroll range (600 here),
       * the mirror of bottom and right sheets: dragging toward the screen edge INCREASES the scroll.
       */
      describe.each([
        ["top", "y"],
        ["left", "x"],
      ] as const)("%s placement", (placement, axis) => {
        const at = (value: number) => (axis === "y" ? {y: value} : {x: value});
        /** A slow drag of `delta` px along the axis, released where it stopped. */
        const slowDrag = (delta: number) => {
          pointer("pointerdown", handle(), {t: 0, ...at(100)});
          pointer("pointermove", handle(), {t: 1000, ...at(100 + delta)});
          pointer("pointerup", handle(), {t: 2000, ...at(100 + delta)});
        };
        /** 30px in 20ms: a flick. Negative `delta` moves toward the screen edge. */
        const flick = (delta: number) => {
          pointer("pointerdown", handle(), {t: 0, ...at(100)});
          pointer("pointermove", handle(), {t: 20, ...at(100 + delta)});
          pointer("pointerup", handle(), {t: 21, ...at(100 + delta)});
        };

        it("dragging toward the edge increases the scroll", async () => {
          render(<HandleSheet placement={placement} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, ...at(100)});
          pointer("pointermove", handle(), {t: 500, ...at(50)});
          expect(writes.at(-1)).toBe(350);
          pointer("pointermove", handle(), {t: 1000, ...at(130)});
          expect(writes.at(-1)).toBe(270);
        });

        it("a slow release settles on the nearest snap and does not close", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet placement={placement} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          slowDrag(-50);

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });

        it("dragging past the lowest snap toward the edge lands on the extent and closes", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet placement={placement} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          slowDrag(-250);

          expect(writes.at(-1)).toBe(600);
          expect(onOpenChange).toHaveBeenCalledTimes(1);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("isDismissable={false}: the same drag settles on the lowest snap and never closes", async () => {
          const onOpenChange = vi.fn();

          render(
            <HandleSheet isDismissable={false} placement={placement} onOpenChange={onOpenChange} />,
          );
          await screen.findByRole("dialog");

          slowDrag(-250);
          expect(writes.at(-1)).toBe(300);
          flick(-30);
          expect(writes.at(-1)).toBe(300);

          expect(onOpenChange).not.toHaveBeenCalled();
        });

        it("a flick toward the edge closes; a flick away reveals the next snap", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet placement={placement} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          // Away from the edge: the scroll falls from 270, toward more of the sheet: 0 is the full
          // sheet, though 300 is nearer.
          flick(30);
          expect(writes.at(-1)).toBe(0);
          expect(onOpenChange).not.toHaveBeenCalled();
        });

        it("a flick toward the edge closes a dismissable sheet", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet placement={placement} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          flick(-30);

          expect(writes.at(-1)).toBe(600);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        describe("without snap points", () => {
          it("a flick toward the edge closes at the extent", async () => {
            const onOpenChange = vi.fn();

            render(
              <HandleSheet placement={placement} snapPoints={null} onOpenChange={onOpenChange} />,
            );
            await screen.findByRole("dialog");

            flick(-30);

            expect(writes.at(-1)).toBe(600);
            expect(onOpenChange).toHaveBeenCalledWith(false);
          });

          it("a flick away from the edge, or a short slow drag, settles back", async () => {
            const onOpenChange = vi.fn();

            render(
              <HandleSheet placement={placement} snapPoints={null} onOpenChange={onOpenChange} />,
            );
            await screen.findByRole("dialog");

            flick(30);
            expect(writes.at(-1)).toBe(300);
            slowDrag(-10);
            expect(writes.at(-1)).toBe(300);
            expect(onOpenChange).not.toHaveBeenCalled();
          });

          it("isDismissable={false}: a flick toward the edge settles and never closes", async () => {
            const onOpenChange = vi.fn();

            render(
              <HandleSheet
                isDismissable={false}
                placement={placement}
                snapPoints={null}
                onOpenChange={onOpenChange}
              />,
            );
            await screen.findByRole("dialog");

            flick(-30);

            expect(writes.at(-1)).toBe(300);
            expect(onOpenChange).not.toHaveBeenCalled();
          });
        });
      });

      /*
       * The primitive pins the scroller to `direction: ltr` (Sheet.mjs, "The scroll geometry is
       * physical"), so scrollLeft stays non-negative and the edges are physical in RTL: the same drag
       * gives the same targets as in LTR. jsdom cannot apply that CSS; a real `dir=rtl` page is
       * Task 10's.
       */
      describe.each([["ar-EG"], ["he-IL"]])("RTL locale %s", (locale) => {
        const rtl = (node: React.ReactNode) =>
          render(
            <I18nProvider locale={locale}>
              <div dir="rtl">{node}</div>
            </I18nProvider>,
          );

        it("a right sheet drags and dismisses toward the right edge, as in LTR", async () => {
          const onOpenChange = vi.fn();

          rtl(<HandleSheet placement="right" onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, x: 100});
          pointer("pointermove", handle(), {t: 500, x: 150});
          expect(writes.at(-1)).toBe(250);
          pointer("pointermove", handle(), {t: 1000, x: 350});
          pointer("pointerup", handle(), {t: 2000, x: 350});

          expect(writes.at(-1)).toBe(0);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("a left sheet drags and dismisses toward the left edge, as in LTR", async () => {
          const onOpenChange = vi.fn();

          rtl(<HandleSheet placement="left" onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, x: 100});
          pointer("pointermove", handle(), {t: 500, x: 50});
          expect(writes.at(-1)).toBe(350);
          pointer("pointermove", handle(), {t: 1000, x: -150});
          pointer("pointerup", handle(), {t: 2000, x: -150});

          expect(writes.at(-1)).toBe(600);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("isDismissable={false}: a right sheet settles on the lowest snap", async () => {
          const onOpenChange = vi.fn();

          rtl(<HandleSheet isDismissable={false} placement="right" onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, x: 100});
          pointer("pointermove", handle(), {t: 1000, x: 350});
          pointer("pointerup", handle(), {t: 2000, x: 350});

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });
      });

      describe("when no resting position can be measured", () => {
        it("falls back to the edge dismissal, so a flick still closes a dismissable sheet", async () => {
          // Every marker measures to the closed position: there is no position to settle on.
          targets = [0, 0, 0];
          const onOpenChange = vi.fn();

          render(<HandleSheet onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 20, y: 130});
          pointer("pointerup", handle(), {t: 21, y: 130});

          expect(writes.at(-1)).toBe(0);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("isDismissable={false}: the fallback settles back and never closes", async () => {
          targets = [0, 0, 0];
          const onOpenChange = vi.fn();

          render(<HandleSheet isDismissable={false} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 20, y: 130});
          pointer("pointerup", handle(), {t: 21, y: 130});

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });
      });

      describe("distance threshold without snap points", () => {
        // The dialog is 400px tall, so a quarter of it is 100px.
        const sizeDialog = () => {
          const previous = vi
            .mocked(HTMLElement.prototype.getBoundingClientRect)
            .getMockImplementation();

          vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
            this: HTMLElement,
          ) {
            if (this.dataset["slot"] === "sheet-dialog") {
              return {bottom: 400, height: 400, left: 0, right: 400, top: 0, width: 400} as DOMRect;
            }

            return previous!.call(this);
          });
        };

        it("a slow drag of a quarter of the size or more closes the sheet", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet snapPoints={null} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");
          sizeDialog();

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 4000, y: 200});
          pointer("pointerup", handle(), {t: 8000, y: 200});

          expect(writes.at(-1)).toBe(0);
          expect(onOpenChange).toHaveBeenCalledWith(false);
        });

        it("a slow drag of less than a quarter settles back", async () => {
          const onOpenChange = vi.fn();

          render(<HandleSheet snapPoints={null} onOpenChange={onOpenChange} />);
          await screen.findByRole("dialog");
          sizeDialog();

          pointer("pointerdown", handle(), {t: 0, y: 100});
          pointer("pointermove", handle(), {t: 4000, y: 199});
          pointer("pointerup", handle(), {t: 8000, y: 199});

          expect(writes.at(-1)).toBe(300);
          expect(onOpenChange).not.toHaveBeenCalled();
        });
      });

      it("a non-primary button or a second pointer id does not start a drag", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {button: 2, t: 0, y: 100});
        pointer("pointermove", handle(), {t: 500, y: 150});
        expect(writes).toEqual([]);
        expect(handle()).not.toHaveAttribute("data-dragging");

        // A second finger neither starts a drag of its own nor moves or ends the active one.
        pointer("pointerdown", handle(), {t: 1000, y: 100});
        pointer("pointerdown", handle(), {id: 2, isPrimary: false, t: 1001, y: 500});
        pointer("pointermove", handle(), {id: 2, isPrimary: false, t: 1500, y: 600});
        expect(writes).toEqual([]);
        pointer("pointerup", handle(), {id: 2, isPrimary: false, t: 1600, y: 600});
        expect(handle()).toHaveAttribute("data-dragging");
        pointer("pointermove", handle(), {t: 2000, y: 150});
        expect(writes).toEqual([250]);
        expect(captured).toEqual([1]);
      });

      it("a non-primary pointer does not start a drag even when none is under way", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {id: 3, isPrimary: false, t: 0, y: 100});
        pointer("pointermove", handle(), {id: 3, isPrimary: false, t: 500, y: 150});

        expect(writes).toEqual([]);
        expect(captured).toEqual([]);
        expect(handle()).not.toHaveAttribute("data-dragging");
      });

      it("a second pointer that is primary but has another id cannot hijack the drag", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {id: 1, t: 0, y: 100});
        pointer("pointerdown", handle(), {id: 2, t: 1, y: 500});
        pointer("pointermove", handle(), {id: 2, t: 500, y: 600});

        expect(writes).toEqual([]);
        expect(captured).toEqual([1]);
      });

      it("unmounting mid-drag releases pointer capture and removes the drag attributes", async () => {
        const {unmount} = render(<HandleSheet />);

        await screen.findByRole("dialog");

        const node = handle();
        const scrollerNode = scroller();

        pointer("pointerdown", node, {t: 0, y: 100});
        pointer("pointermove", node, {t: 500, y: 150});
        expect(scrollerNode).toHaveAttribute("data-handle-dragging");

        unmount();

        expect(released).toContain(1);
        expect(scrollerNode).not.toHaveAttribute("data-handle-dragging");
        expect(node).not.toHaveAttribute("data-dragging");
      });

      it("unmounting during the release animation cancels the pending animation frame", async () => {
        reduceMotion(false);
        const request = vi.spyOn(window, "requestAnimationFrame").mockReturnValue(77);
        const cancel = vi.spyOn(window, "cancelAnimationFrame");
        const {unmount} = render(<HandleSheet />);

        await screen.findByRole("dialog");

        const scrollerNode = scroller();

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 180});
        request.mockClear();
        pointer("pointerup", handle(), {t: 2000, y: 180});

        // The release is animating: a frame is pending and the scroller is still held.
        expect(request).toHaveBeenCalled();
        expect(scrollerNode).toHaveAttribute("data-handle-dragging");
        cancel.mockClear();

        unmount();

        expect(cancel).toHaveBeenCalledWith(77);
        expect(scrollerNode).not.toHaveAttribute("data-handle-dragging");
      });

      it("a release animates to the target and then lets go of the scroller", async () => {
        reduceMotion(false);
        const onOpenChange = vi.fn();

        render(<HandleSheet onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");
        vi.useFakeTimers({
          toFake: ["cancelAnimationFrame", "performance", "requestAnimationFrame"],
        });

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 180});
        pointer("pointerup", handle(), {t: 2000, y: 180});
        const dragEnd = writes.length;

        // Nothing has moved yet: the release is a glide, not a jump.
        expect(scroller()).toHaveAttribute("data-handle-dragging");
        act(() => {
          vi.advanceTimersByTime(100);
        });
        expect(writes.length).toBeGreaterThan(dragEnd);
        expect(writes.at(-1)).toBeGreaterThan(220);
        expect(writes.at(-1)).toBeLessThan(300);
        expect(scroller()).toHaveAttribute("data-handle-dragging");

        act(() => {
          vi.advanceTimersByTime(600);
        });
        expect(writes.at(-1)).toBe(300);
        expect(scroller()).not.toHaveAttribute("data-handle-dragging");
        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it("pointercancel and lostpointercapture restore the starting position", async () => {
        const onOpenChange = vi.fn();

        render(<HandleSheet onOpenChange={onOpenChange} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 500, y: 350});
        expect(writes.at(-1)).toBe(50);
        pointer("pointercancel", handle(), {t: 600, y: 350});
        expect(writes.at(-1)).toBe(300);
        expect(handle()).not.toHaveAttribute("data-dragging");
        expect(scroller()).not.toHaveAttribute("data-handle-dragging");

        pointer("pointerdown", handle(), {t: 1000, y: 100});
        pointer("pointermove", handle(), {t: 1500, y: 350});
        expect(writes.at(-1)).toBe(50);
        lostCapture();
        expect(writes.at(-1)).toBe(300);
        expect(handle()).not.toHaveAttribute("data-dragging");
        expect(onOpenChange).not.toHaveBeenCalled();
      });

      it("the lostpointercapture that follows our own release does not undo the release", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: -150});
        pointer("pointerup", handle(), {t: 2000, y: -150});
        expect(writes.at(-1)).toBe(600);

        // The browser reports the capture we released, with the pointer's own id, before the next
        // pointer event: the drag is over by then, so it must not restore the start (300).
        const settled = writes.length;

        lostCapture(1);
        expect(writes).toHaveLength(settled);

        // And the next gesture with that pointer still drives the sheet.
        pointer("pointerdown", handle(), {t: 3000, y: 100});
        pointer("pointermove", handle(), {t: 3500, y: 150});
        expect(writes.at(-1)).toBe(550);
        expect(handle()).toHaveAttribute("data-dragging");
      });

      it("ignores a lostpointercapture for another pointer id while a drag is active", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 150});
        const before = writes.length;

        lostCapture(9);

        expect(writes).toHaveLength(before);
        expect(handle()).toHaveAttribute("data-dragging");
      });

      it("structural: the handle's pointer handlers are not attached to the Body subtree", async () => {
        render(<HandleSheet withBody />);
        await screen.findByRole("dialog");
        const child = screen.getByTestId("body-child");

        pointer("pointerdown", child, {t: 0, y: 100});
        pointer("pointermove", child, {t: 500, y: 200});
        pointer("pointerup", child, {t: 600, y: 200});

        expect(writes).toEqual([]);
        expect(handle()).not.toHaveAttribute("data-dragging");
        expect(scroller()).not.toHaveAttribute("data-handle-dragging");
      });

      it("a consumer pointer handler runs first and can claim the gesture", async () => {
        const calls: string[] = [];

        render(
          <HandleSheet
            handleProps={{
              onPointerDown: (event) => {
                calls.push("down");
                event.preventDefault();
              },
              onPointerMove: () => calls.push("move"),
              onPointerUp: () => calls.push("up"),
            }}
          />,
        );
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 500, y: 150});
        pointer("pointerup", handle(), {t: 600, y: 150});

        expect(calls).toEqual(["down", "move", "up"]);
        expect(writes).toEqual([]);
        expect(handle()).not.toHaveAttribute("data-dragging");
      });

      it("a consumer that prevents pointermove stops the pointer from driving the scroller", async () => {
        render(<HandleSheet handleProps={{onPointerMove: (event) => event.preventDefault()}} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 500, y: 150});

        expect(writes).toEqual([]);
      });

      it("a consumer that prevents pointerup cannot leave the drag stuck", async () => {
        render(<HandleSheet handleProps={{onPointerUp: (event) => event.preventDefault()}} />);
        await screen.findByRole("dialog");

        pointer("pointerdown", handle(), {t: 0, y: 100});
        pointer("pointermove", handle(), {t: 1000, y: 180});
        pointer("pointerup", handle(), {t: 2000, y: 180});

        expect(handle()).not.toHaveAttribute("data-dragging");
        expect(scroller()).not.toHaveAttribute("data-handle-dragging");
      });

      it("a decorative handle (no snap points) is draggable too", async () => {
        render(<HandleSheet snapPoints={null} />);
        await screen.findByRole("dialog");

        expect(handle()).toHaveAttribute("aria-hidden", "true");
        pointer("pointerdown", handle(), {t: 0, y: 100});
        expect(handle()).toHaveAttribute("data-dragging");
      });
    });

    describe("key guards", () => {
      it("ignores modifier chords and leaves them to the browser", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");
        act(() => slider().focus());
        scrollCalls.length = 0;

        const altLeft = fireEvent.keyDown(slider(), {altKey: true, key: "ArrowLeft"});
        const ctrlHome = fireEvent.keyDown(slider(), {ctrlKey: true, key: "Home"});
        const metaEnd = fireEvent.keyDown(slider(), {key: "End", metaKey: true});

        // fireEvent returns false when the event was default-prevented.
        expect([altLeft, ctrlHome, metaEnd]).toEqual([true, true, true]);
        expect(scrollCalls).toEqual([]);
      });

      it("does not step when a consumer onKeyDown prevented the key", async () => {
        render(
          <HandleSheet
            handleProps={{
              onKeyDown: (event) => event.preventDefault(),
            }}
          />,
        );
        await screen.findByRole("dialog");
        act(() => slider().focus());
        scrollCalls.length = 0;

        await user.keyboard("{ArrowUp}");

        expect(scrollCalls).toEqual([]);
      });

      it("does not prevent keys it has no use for", async () => {
        render(<HandleSheet />);
        await screen.findByRole("dialog");
        act(() => slider().focus());

        // (Tab is not asserted: the dialog's own focus containment owns it.)
        expect(fireEvent.keyDown(slider(), {key: "a"})).toBe(true);
        expect(fireEvent.keyDown(slider(), {key: "PageUp"})).toBe(true);
        expect(fireEvent.keyDown(slider(), {key: "ArrowUp", shiftKey: true})).toBe(false);
      });

      it("renders a sheet whose only snap points are full size as a decorative handle", async () => {
        render(<HandleSheet snapPoints={["100%", "1"]} />);
        await screen.findByRole("dialog");

        expect(screen.queryByRole("slider")).toBeNull();
        expect(document.querySelector("[data-sheet-handle]")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
      });
    });
  });

  /*
   * jsdom cannot show the stacking: the parent's scale-back and dim are CSS animations on a view
   * timeline and the restore is a real scroll. These tests prove the wiring (both dialogs, one stack
   * index each, the topmost-only Escape, independent state and lifecycle, focus return, no stuck
   * inert); the visuals are for the Playwright spec.
   */
  describe("nested", () => {
    const settle = () => new Promise((resolve) => setTimeout(resolve, 60));
    const overlays = () =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="sheet-overlay"]')].filter(
        (element) => element.isConnected,
      );
    const dialogs = () => screen.queryAllByRole("dialog", {hidden: true});
    const scrollerCalls = new Map<Element, ScrollToOptions[]>();

    const NestedExample = ({
      childProps = {},
      parentProps = {},
    }: {
      childProps?: {
        isDismissable?: boolean;
        onAnimationEnd?: (open: boolean) => void;
        onOpenChange?: (open: boolean) => void;
      };
      parentProps?: {
        isDismissable?: boolean;
        onAnimationEnd?: (open: boolean) => void;
        onOpenChange?: (open: boolean) => void;
      };
    }) => (
      <Sheet {...parentProps}>
        <Sheet.Trigger>
          <Button>Open parent</Button>
        </Sheet.Trigger>
        <Sheet.Backdrop>
          <Sheet.Content>
            <Sheet.Dialog aria-label="Parent sheet">
              <Sheet.Body>Parent content</Sheet.Body>
              <Sheet.NestedRoot {...childProps}>
                <Sheet.Trigger>
                  <Button>Open child</Button>
                </Sheet.Trigger>
                <Sheet.Backdrop>
                  <Sheet.Content>
                    <Sheet.Dialog aria-label="Child sheet">
                      <Sheet.Body>Child content</Sheet.Body>
                      <Sheet.Close>
                        <Button>Close child</Button>
                      </Sheet.Close>
                    </Sheet.Dialog>
                  </Sheet.Content>
                </Sheet.Backdrop>
              </Sheet.NestedRoot>
            </Sheet.Dialog>
          </Sheet.Content>
        </Sheet.Backdrop>
      </Sheet>
    );

    /** Opens the parent, waits for its enter to settle, then opens the child. */
    const openBoth = async () => {
      await user.click(screen.getByRole("button", {name: "Open parent"}));
      await screen.findByRole("dialog", {name: "Parent sheet"});
      await settle();
      await user.click(screen.getByRole("button", {name: "Open child"}));
      await screen.findByRole("dialog", {name: "Child sheet"});
      await settle();
    };

    afterEach(() => {
      for (const name of [
        "scrollHeight",
        "setPointerCapture",
        "hasPointerCapture",
        "releasePointerCapture",
      ]) {
        Reflect.deleteProperty(HTMLElement.prototype, name);
      }
    });

    beforeEach(() => {
      scrollerCalls.clear();

      const stubbed = HTMLElement.prototype.scrollTo;

      // Records which scroller each scroll was sent to, then plays the geometry stub's script.
      Object.defineProperty(HTMLElement.prototype, "scrollTo", {
        configurable: true,
        value: function scrollTo(this: HTMLElement, options?: ScrollToOptions) {
          scrollerCalls.set(this, [...(scrollerCalls.get(this) ?? []), options ?? {}]);

          return Reflect.apply(stubbed, this, [options]);
        },
        writable: true,
      });

      // The primitive's modal focus override scrolls a focused element into view when its rect
      // lies below the scroller's. The stub's default rect (ending at the viewport height, against a
      // zero client height) always does, so the sheet would be scrolled by every focus change; a
      // browser finds a button in view. Buttons report an on-screen rect here, so only the sheet's
      // own scrolls are recorded.
      const baseRect = vi
        .mocked(HTMLElement.prototype.getBoundingClientRect)
        .getMockImplementation();

      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (
        this: HTMLElement,
      ) {
        if (this.tagName === "BUTTON") {
          return {bottom: 0, height: 0, left: 0, right: 0, top: 0, width: 0, x: 0, y: 0} as DOMRect;
        }

        return baseRect!.call(this);
      });
    });

    it("opens a nested sheet over its parent and both dialogs exist", async () => {
      render(<NestedExample />);
      await openBoth();

      expect(dialogs().map((dialog) => dialog.getAttribute("aria-label"))).toEqual([
        "Parent sheet",
        "Child sheet",
      ]);
      // The primitive stacks them by mount order: it is what the scale and dim styles key on.
      const [parent, child] = overlays();

      expect(parent).toHaveAttribute("data-stack-index", "0");
      expect(parent).toHaveAttribute("data-has-descendants");
      expect(child).toHaveAttribute("data-stack-index", "1");
      expect(child).not.toHaveAttribute("data-has-descendants");
    });

    it("keeps the nested overlay a sibling of the parent's, not inside it", async () => {
      render(<NestedExample />);
      await openBoth();

      const [parent, child] = overlays();

      expect(parent!.contains(child!)).toBe(false);
    });

    it("closes only the topmost sheet on Escape and the parent stays open", async () => {
      const parentOpenChange = vi.fn();
      const childOpenChange = vi.fn();

      render(
        <NestedExample
          childProps={{onOpenChange: childOpenChange}}
          parentProps={{onOpenChange: parentOpenChange}}
        />,
      );
      await openBoth();
      parentOpenChange.mockClear();

      await user.keyboard("{Escape}");

      await waitFor(() => expect(dialogs()).toHaveLength(1));
      expect(screen.getByRole("dialog", {name: "Parent sheet"})).toBeInTheDocument();
      expect(childOpenChange).toHaveBeenLastCalledWith(false);
      expect(parentOpenChange).not.toHaveBeenCalled();
      expect(overlays()[0]).not.toHaveAttribute("data-has-descendants");
    });

    it("closes the parent on the next Escape once the child is gone", async () => {
      render(<NestedExample />);
      await openBoth();

      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      // Focus comes back to the child's Trigger, inside the parent, where Escape is heard again.
      await waitFor(() => expect(screen.getByRole("button", {name: "Open child"})).toHaveFocus());
      await user.keyboard("{Escape}");

      await waitFor(() => expect(dialogs()).toHaveLength(0));
    });

    it("closing the child leaves the parent's onAnimationEnd and open state unchanged", async () => {
      const parentAnimationEnd = vi.fn();
      const childAnimationEnd = vi.fn();
      const parentOpenChange = vi.fn();

      render(
        <NestedExample
          childProps={{onAnimationEnd: childAnimationEnd}}
          parentProps={{onAnimationEnd: parentAnimationEnd, onOpenChange: parentOpenChange}}
        />,
      );
      await openBoth();
      await waitFor(() => expect(childAnimationEnd.mock.calls).toEqual([[true]]));
      expect(parentAnimationEnd.mock.calls).toEqual([[true]]);
      parentOpenChange.mockClear();

      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await settle();

      // The child reported its own exit; the parent reported nothing new and is still open.
      expect(childAnimationEnd.mock.calls).toEqual([[true], [false]]);
      expect(parentAnimationEnd.mock.calls).toEqual([[true]]);
      expect(parentOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog", {name: "Parent sheet"})).toBeInTheDocument();
    });

    it("closing the child restores the parent snap point", async () => {
      render(<NestedExample />);
      await user.click(screen.getByRole("button", {name: "Open parent"}));
      await screen.findByRole("dialog", {name: "Parent sheet"});
      await settle();

      const parentScroller = document.querySelector<HTMLElement>("[data-sheet-scroll]")!;
      const resting = parentScroller.scrollTop;

      expect(resting).toBe(768);

      await user.click(screen.getByRole("button", {name: "Open child"}));
      await screen.findByRole("dialog", {name: "Child sheet"});
      await settle();
      const callsBeforeClose = scrollerCalls.get(parentScroller)?.length ?? 0;

      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await settle();

      const parentCalls = scrollerCalls.get(parentScroller) ?? [];

      // The parent's scroller is left alone by the child's exit, and its last target is its rest.
      expect(parentCalls).toHaveLength(callsBeforeClose);
      expect(parentCalls.at(-1)?.top).toBe(resting);
      expect(parentScroller.scrollTop).toBe(resting);
    });

    it("keeps the parent's panel on screen through the child's exit", async () => {
      render(<NestedExample />);
      await user.click(screen.getByRole("button", {name: "Open parent"}));
      await screen.findByRole("dialog", {name: "Parent sheet"});
      await settle();

      const parentScroller = document.querySelector<HTMLElement>("[data-sheet-scroll]")!;

      expect(isSheetPanelOnScreen(parentScroller)).toBe(true);

      await user.click(screen.getByRole("button", {name: "Open child"}));
      await screen.findByRole("dialog", {name: "Child sheet"});
      await settle();
      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await settle();

      // The stub models a browser: only the child's panel left. The lifecycle's own geometry check
      // for the parent still sees it, so a late scrollend of the parent reports nothing new.
      expect(isSheetPanelOnScreen(parentScroller)).toBe(true);
    });

    it("leaves no inert or aria-hidden on the parent after the child closes", async () => {
      render(<NestedExample />);
      await openBoth();

      const parentDialog = screen.getByRole("dialog", {name: "Parent sheet", hidden: true});

      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await settle();

      expect(parentDialog.closest("[inert], [aria-hidden='true']")).toBeNull();
      expect(screen.getByRole("button", {name: "Open child"})).toBeInTheDocument();

      // A second round trip leaves it clean too.
      await user.click(screen.getByRole("button", {name: "Open child"}));
      await screen.findByRole("dialog", {name: "Child sheet"});
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await settle();

      expect(parentDialog.closest("[inert], [aria-hidden='true']")).toBeNull();
    });

    it("returns focus to the child's Trigger inside the parent when the child closes", async () => {
      render(<NestedExample />);
      await openBoth();

      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));

      await waitFor(() => expect(screen.getByRole("button", {name: "Open child"})).toHaveFocus());
      // The parent is interactive again: its Trigger-less content takes a click without a throw.
      await user.click(screen.getByRole("button", {name: "Open child"}));
      await screen.findByRole("dialog", {name: "Child sheet"});
    });

    it("judges a Trigger inside a NestedRoot by its own root", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});

      render(<NestedExample />);
      await openBoth();

      // The child's trigger was detected by the child's root: it opened the child, with no warning.
      expect(error).not.toHaveBeenCalledWith(expect.stringContaining("Sheet.Trigger must be"));
    });

    it("warns about an undetected Trigger in a NestedRoot even when the parent has a Trigger", async () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const Wrapped = () => (
        <Sheet.Trigger>
          <Button>Open child</Button>
        </Sheet.Trigger>
      );

      render(
        <Sheet defaultOpen>
          <Sheet.Trigger>
            <Button>Open parent</Button>
          </Sheet.Trigger>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog aria-label="Parent sheet">
                <Sheet.NestedRoot>
                  <Wrapped />
                </Sheet.NestedRoot>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );
      await screen.findByRole("dialog", {name: "Parent sheet"});

      expect(error).toHaveBeenCalledWith(expect.stringContaining("Sheet.Trigger must be"));
    });

    it("keeps isDismissable independent between the child and the parent", async () => {
      render(<NestedExample childProps={{isDismissable: false}} />);
      await openBoth();

      // The child refuses Escape; the parent behind it is not asked and stays open too.
      await user.keyboard("{Escape}");
      await settle();

      expect(dialogs()).toHaveLength(2);

      await user.click(screen.getByRole("button", {name: "Close child"}));
      await waitFor(() => expect(dialogs()).toHaveLength(1));
      await waitFor(() => expect(screen.getByRole("button", {name: "Open child"})).toHaveFocus());

      // The parent is dismissable by default: its Escape still closes it.
      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialogs()).toHaveLength(0));
    });

    it("keeps a dismissable child closable when the parent is not dismissable", async () => {
      render(<NestedExample parentProps={{isDismissable: false}} />);
      await openBoth();

      await user.keyboard("{Escape}");
      await waitFor(() => expect(dialogs()).toHaveLength(1));

      // The parent refuses Escape.
      await user.keyboard("{Escape}");
      await settle();

      expect(dialogs()).toHaveLength(1);
    });

    it("drags the nested handle without moving the parent scroller", async () => {
      const writes = new Map<Element, number[]>();

      Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
        configurable: true,
        value: 600,
      });
      // The child opens from the parent, so it is the topmost overlay and hears the pointer.
      render(
        <Sheet>
          <Sheet.Trigger>
            <Button>Open parent</Button>
          </Sheet.Trigger>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog aria-label="Parent sheet">
                <Sheet.Handle data-testid="parent-handle" />
                <Sheet.NestedRoot>
                  <Sheet.Trigger>
                    <Button>Open child</Button>
                  </Sheet.Trigger>
                  <Sheet.Backdrop>
                    <Sheet.Content>
                      <Sheet.Dialog aria-label="Child sheet">
                        <Sheet.Handle data-testid="child-handle" />
                      </Sheet.Dialog>
                    </Sheet.Content>
                  </Sheet.Backdrop>
                </Sheet.NestedRoot>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );
      await openBoth();

      const scrollers = [...document.querySelectorAll<HTMLElement>("[data-sheet-scroll]")];
      const childScroller = screen.getByTestId("child-handle").closest("[data-sheet-scroll]");
      const parentScroller = scrollers.find((scroller) => scroller !== childScroller);

      expect(scrollers).toHaveLength(2);
      expect(childScroller).not.toBeNull();
      for (const scroller of scrollers) {
        let value = 300;

        Object.defineProperty(scroller, "scrollTop", {
          configurable: true,
          get: () => value,
          set: (next: number) => {
            value = next;
            writes.set(scroller, [...(writes.get(scroller) ?? []), next]);
          },
        });
      }

      const handle = screen.getByTestId("child-handle");
      const send = (type: string, y: number, t: number) => {
        const event = new PointerEvent(type, {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientY: y,
          isPrimary: true,
          pointerId: 1,
        });

        Object.defineProperty(event, "timeStamp", {value: t + 1});
        Object.defineProperty(event, "isPrimary", {value: true});
        fireEvent(handle, event);
      };

      // Removed again by this block's afterEach, so a failed assertion leaks nothing.
      for (const [name, value] of [
        ["setPointerCapture", () => {}],
        ["hasPointerCapture", () => true],
        ["releasePointerCapture", () => {}],
      ] as const) {
        Object.defineProperty(HTMLElement.prototype, name, {configurable: true, value});
      }

      send("pointerdown", 100, 0);
      send("pointermove", 140, 100);

      expect(writes.get(childScroller!)?.length).toBeGreaterThan(0);
      expect(writes.get(parentScroller!)).toBeUndefined();
    });

    it("known limitation: a child mounted open together with its parent is not topmost; open the child from the parent", async () => {
      const parentOpenChange = vi.fn();
      const childOpenChange = vi.fn();

      render(
        <Sheet defaultOpen onOpenChange={parentOpenChange}>
          <Sheet.Backdrop>
            <Sheet.Content>
              <Sheet.Dialog aria-label="Parent sheet">
                <Sheet.NestedRoot defaultOpen onOpenChange={childOpenChange}>
                  <Sheet.Backdrop>
                    <Sheet.Content>
                      <Sheet.Dialog aria-label="Child sheet">child</Sheet.Dialog>
                    </Sheet.Content>
                  </Sheet.Backdrop>
                </Sheet.NestedRoot>
              </Sheet.Dialog>
            </Sheet.Content>
          </Sheet.Backdrop>
        </Sheet>,
      );
      await screen.findByRole("dialog", {name: "Child sheet", hidden: true});
      await settle();

      // The primitive registers the sheets in effect order, child first: the child is the bottom of
      // the stack and the parent sits over it (the reverse of a child opened from the parent).
      const stackIndex = (label: string) =>
        screen
          .getByRole("dialog", {name: label, hidden: true})
          .closest('[data-slot="sheet-overlay"]')
          ?.getAttribute("data-stack-index");

      expect(stackIndex("Child sheet")).toBe("0");
      expect(stackIndex("Parent sheet")).toBe("1");

      // So Escape reaches the parent first, not the child that is visually on top.
      await user.keyboard("{Escape}");
      await waitFor(() => expect(parentOpenChange).toHaveBeenCalledWith(false));
      expect(childOpenChange).not.toHaveBeenCalled();
    });
  });
});

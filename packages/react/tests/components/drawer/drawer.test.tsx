import {cleanup, fireEvent, render, screen, setupUser} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Drawer, DrawerRoot} from "@/components/drawer/index.ts";
import {useOverlayState} from "@/hooks/index.ts";

type Placement = "top" | "bottom" | "left" | "right";

const DrawerExample = ({
  isDismissable,
  placement,
}: {
  isDismissable?: boolean;
  placement?: Placement;
} = {}) => (
  <Drawer>
    <Button>Open</Button>
    <Drawer.Backdrop isDismissable={isDismissable}>
      <Drawer.Content placement={placement}>
        <Drawer.Dialog>
          <Drawer.Handle />
          <Drawer.CloseTrigger />
          <Drawer.Header>
            <Drawer.Heading>Title</Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>Content</Drawer.Body>
          <Drawer.Footer>
            <Button slot="close">Continue</Button>
          </Drawer.Footer>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  </Drawer>
);

const openDrawer = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole("button", {name: "Open"}));

  return screen.getByRole("dialog");
};

const slot = (name: string) => document.querySelector(`[data-slot="${name}"]`);

describe("Drawer", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    user = setupUser();
  });

  afterEach(() => {
    cleanup();
  });

  describe("open and close", () => {
    it("renders nothing until the trigger is pressed", async () => {
      render(<DrawerExample />);

      expect(screen.queryByRole("dialog")).toBeNull();

      const dialog = await openDrawer(user);

      expect(dialog).toHaveTextContent("Content");
    });

    it("moves focus into the dialog on open", async () => {
      render(<DrawerExample />);

      const dialog = await openDrawer(user);

      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    it("closes on Escape", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      await user.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("keeps the dialog open on Escape with isKeyboardDismissDisabled", async () => {
      render(
        <Drawer>
          <Button>Open</Button>
          <Drawer.Backdrop isKeyboardDismissDisabled>
            <Drawer.Content>
              <Drawer.Dialog>
                <Drawer.Heading>Pinned</Drawer.Heading>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      await openDrawer(user);
      await user.keyboard("{Escape}");

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("closes with the close trigger", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      await user.click(screen.getByRole("button", {name: "Close"}));

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("closes with a slot=close button", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      await user.click(screen.getByRole("button", {name: "Continue"}));

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("hands close to a function child of the dialog", async () => {
      render(
        <Drawer>
          <Button>Open</Button>
          <Drawer.Backdrop>
            <Drawer.Content>
              <Drawer.Dialog>
                {({close}) => (
                  <>
                    <Drawer.Heading>Render prop</Drawer.Heading>
                    <Button onPress={close}>Done</Button>
                  </>
                )}
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      await openDrawer(user);
      await user.click(screen.getByRole("button", {name: "Done"}));

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("calls onOpenChange on open and close", async () => {
      const onOpenChange = vi.fn();

      render(
        <Drawer onOpenChange={onOpenChange}>
          <Button>Open</Button>
          <Drawer.Backdrop>
            <Drawer.Content>
              <Drawer.Dialog>
                <Drawer.Heading>Events</Drawer.Heading>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      await openDrawer(user);
      await user.keyboard("{Escape}");

      expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
      expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    });

    it("follows the state from useOverlayState", async () => {
      const Stateful = () => {
        const state = useOverlayState();

        return (
          <>
            <Button onPress={state.open}>From state</Button>
            <Drawer state={state}>
              <Drawer.Backdrop>
                <Drawer.Content>
                  <Drawer.Dialog>
                    <Drawer.Heading>Controlled</Drawer.Heading>
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>
          </>
        );
      };

      render(<Stateful />);

      expect(screen.queryByRole("dialog")).toBeNull();

      await user.click(screen.getByRole("button", {name: "From state"}));

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("labels the dialog with the heading", async () => {
      render(<DrawerExample />);

      const dialog = await openDrawer(user);
      const heading = screen.getByRole("heading", {name: "Title"});

      expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
    });

    it("hides the decorative handle from assistive technology", async () => {
      render(<DrawerExample />);

      await openDrawer(user);

      expect(slot("drawer-handle")).toHaveAttribute("aria-hidden", "true");
    });

    it("lets a consumer label override the close button's default name", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Backdrop>
            <Drawer.Content>
              <Drawer.Dialog aria-label="Panel">
                <Drawer.CloseTrigger aria-label="Dismiss panel" />
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      expect(screen.getByRole("button", {name: "Dismiss panel"})).toBeInTheDocument();
    });
  });

  describe("slots and variants", () => {
    it("marks every part with its data-slot", async () => {
      render(<DrawerExample />);

      await openDrawer(user);

      for (const name of [
        "drawer-backdrop",
        "drawer-content",
        "drawer-dialog",
        "drawer-handle",
        "drawer-handle-bar",
        "drawer-header",
        "drawer-heading",
        "drawer-body",
        "drawer-footer",
      ]) {
        expect(slot(name)).not.toBeNull();
      }
    });

    it("renames the close button's slot to drawer-close-trigger", async () => {
      render(<DrawerExample />);

      await openDrawer(user);

      expect(screen.getByRole("button", {name: "Close"})).toHaveAttribute(
        "data-slot",
        "drawer-close-trigger",
      );
    });

    it("marks the trigger part with its data-slot", () => {
      render(
        <Drawer>
          <Drawer.Trigger>Open</Drawer.Trigger>
          <Drawer.Backdrop>
            <Drawer.Content>
              <Drawer.Dialog aria-label="Panel">Content</Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      expect(screen.getByRole("button", {name: "Open"})).toHaveAttribute(
        "data-slot",
        "drawer-trigger",
      );
    });

    it("defaults the placement to bottom", async () => {
      render(<DrawerExample />);

      await openDrawer(user);

      expect(slot("drawer-content")).toHaveAttribute("data-placement", "bottom");
      expect(slot("drawer-dialog")).toHaveAttribute("data-placement", "bottom");
    });

    it.each(["top", "bottom", "left", "right"] as const)(
      "carries placement %s on the content and the dialog",
      async (placement) => {
        render(<DrawerExample placement={placement} />);

        await openDrawer(user);

        expect(slot("drawer-content")).toHaveAttribute("data-placement", placement);
        expect(slot("drawer-dialog")).toHaveAttribute("data-placement", placement);
        expect(slot("drawer-content")?.className).toEqual(
          expect.stringContaining(`drawer__content--${placement}`),
        );
      },
    );

    it("applies the backdrop variant modifier", async () => {
      render(
        <Drawer>
          <Button>Open</Button>
          <Drawer.Backdrop variant="blur">
            <Drawer.Content>
              <Drawer.Dialog aria-label="Panel">Content</Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      await openDrawer(user);

      expect(slot("drawer-backdrop")?.className).toEqual(
        expect.stringContaining("drawer__backdrop--blur"),
      );
    });

    it("merges a consumer className into the dialog", () => {
      render(
        <Drawer defaultOpen>
          <Drawer.Backdrop>
            <Drawer.Content>
              <Drawer.Dialog aria-label="Panel" className="custom">
                Content
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>,
      );

      expect(screen.getByRole("dialog").className).toEqual(expect.stringContaining("custom"));
    });
  });

  describe("dismissable state", () => {
    it("marks the dialog draggable by default", async () => {
      render(<DrawerExample />);

      expect(await openDrawer(user)).toHaveAttribute("data-dismissable", "true");
    });

    it("drops the draggable mark with isDismissable false", async () => {
      render(<DrawerExample isDismissable={false} />);

      expect(await openDrawer(user)).not.toHaveAttribute("data-dismissable");
    });
  });

  describe("drag to dismiss", () => {
    // jsdom implements no pointer capture; the drag asks for it once the threshold passes.
    beforeEach(() => {
      HTMLElement.prototype.setPointerCapture = vi.fn();
      HTMLElement.prototype.releasePointerCapture = vi.fn();
    });

    const dragFrom = (target: Element, from: number, to: number) => {
      fireEvent.pointerDown(target, {button: 0, clientX: 0, clientY: from, pointerId: 1});
      fireEvent.pointerMove(target, {clientX: 0, clientY: to, pointerId: 1});
      fireEvent.pointerUp(target, {clientX: 0, clientY: to, pointerId: 1});
    };

    it("closes when the handle is dragged toward the bottom edge", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      dragFrom(slot("drawer-handle")!, 0, 120);

      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("ignores a drag that stays under the activation threshold", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      dragFrom(slot("drawer-handle")!, 0, 4);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("ignores a drag away from the edge the panel came from", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      dragFrom(slot("drawer-handle")!, 120, 0);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not start a drag from the body", async () => {
      render(<DrawerExample />);

      await openDrawer(user);
      dragFrom(slot("drawer-body")!, 0, 120);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("does not drag when the drawer is not dismissable", async () => {
      render(<DrawerExample isDismissable={false} />);

      await openDrawer(user);
      dragFrom(slot("drawer-handle")!, 0, 120);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("call styles", () => {
    it("behaves identically as Drawer.Root and DrawerRoot", () => {
      render(
        <>
          <DrawerRoot>
            <Drawer.Trigger>Flat</Drawer.Trigger>
            <Drawer.Backdrop>
              <Drawer.Content>
                <Drawer.Dialog aria-label="Panel">Flat panel</Drawer.Dialog>
              </Drawer.Content>
            </Drawer.Backdrop>
          </DrawerRoot>
          <Drawer.Root>
            <Drawer.Trigger>Namespaced</Drawer.Trigger>
            <Drawer.Backdrop>
              <Drawer.Content>
                <Drawer.Dialog aria-label="Panel">Namespaced panel</Drawer.Dialog>
              </Drawer.Content>
            </Drawer.Backdrop>
          </Drawer.Root>
        </>,
      );

      for (const name of ["Flat", "Namespaced"]) {
        expect(screen.getByRole("button", {name})).toHaveAttribute("data-slot", "drawer-trigger");
      }
    });
  });
});

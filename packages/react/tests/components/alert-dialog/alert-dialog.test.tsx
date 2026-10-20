import {cleanup, render, screen, setupUser} from "@peakui/testing/helpers";

import {AlertDialog, AlertDialogRoot} from "@/components/alert-dialog/index.ts";
import {Button} from "@/components/button";
import {useOverlayState} from "@/hooks/index.ts";

const Example = ({
  placement,
  size,
  status,
}: {
  placement?: "auto" | "top" | "center" | "bottom";
  size?: "xs" | "sm" | "md" | "lg" | "cover";
  status?: "default" | "accent" | "success" | "warning" | "danger";
} = {}) => (
  <AlertDialog>
    <Button>Open</Button>
    <AlertDialog.Backdrop>
      <AlertDialog.Container placement={placement} size={size}>
        <AlertDialog.Dialog>
          <AlertDialog.CloseTrigger />
          <AlertDialog.Header>
            <AlertDialog.Icon status={status} />
            <AlertDialog.Heading>Delete project?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>This cannot be undone.</AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close">Cancel</Button>
            <Button slot="close">Delete</Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  </AlertDialog>
);

const open = async (user: ReturnType<typeof setupUser>) => {
  await user.click(screen.getByRole("button", {name: "Open"}));

  return screen.getByRole("alertdialog");
};

describe("AlertDialog", () => {
  let user: ReturnType<typeof setupUser>;

  beforeEach(() => {
    user = setupUser();
  });

  afterEach(() => {
    cleanup();
  });

  it("opens an element with the alertdialog role and BEM classes", async () => {
    render(<Example />);

    const dialog = await open(user);

    expect(dialog).toHaveTextContent("This cannot be undone.");
    expect(dialog.className).toEqual(expect.stringContaining("alert-dialog__dialog"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("labels the dialog by its heading", async () => {
    render(<Example />);

    const dialog = await open(user);
    const heading = screen.getByRole("heading", {name: "Delete project?"});

    expect(dialog).toHaveAttribute("aria-labelledby", heading.id);
  });

  it("sets data-slot on every part", async () => {
    render(<Example />);

    await open(user);

    for (const slot of [
      "alert-dialog-backdrop",
      "alert-dialog-container",
      "alert-dialog-dialog",
      "alert-dialog-header",
      "alert-dialog-icon",
      "alert-dialog-default-icon",
      "alert-dialog-heading",
      "alert-dialog-body",
      "alert-dialog-footer",
      "alert-dialog-close-trigger",
    ]) {
      expect(document.querySelector(`[data-slot="${slot}"]`), slot).not.toBeNull();
    }
  });

  it("moves focus into the dialog", async () => {
    render(<Example />);

    const dialog = await open(user);

    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("does not close on Escape by default", async () => {
    render(<Example />);

    await open(user);
    await user.keyboard("{Escape}");

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("closes on Escape when isKeyboardDismissDisabled is false", async () => {
    render(
      <AlertDialog>
        <Button>Open</Button>
        <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Escapable</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    await open(user);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("does not close on an outside press by default", async () => {
    render(<Example />);

    await open(user);
    await user.click(document.querySelector('[data-slot="alert-dialog-backdrop"]')!);

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("closes on an outside press when isDismissable is set", async () => {
    render(
      <AlertDialog>
        <Button>Open</Button>
        <AlertDialog.Backdrop isDismissable>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Dismissable</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    await open(user);
    await user.click(document.querySelector('[data-slot="alert-dialog-backdrop"]')!);

    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("closes from the close trigger and from a slot=close button", async () => {
    render(<Example />);

    await open(user);
    await user.click(screen.getByRole("button", {name: "Close"}));
    expect(screen.queryByRole("alertdialog")).toBeNull();

    await open(user);
    await user.click(screen.getByRole("button", {name: "Cancel"}));
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("renames the CloseButton slot to alert-dialog-close-trigger", async () => {
    render(<Example />);

    await open(user);

    expect(screen.getByRole("button", {name: "Close"})).toHaveAttribute(
      "data-slot",
      "alert-dialog-close-trigger",
    );
  });

  it("tints the icon by status and defaults to danger", async () => {
    const {unmount} = render(<Example />);

    await open(user);
    expect(document.querySelector('[data-slot="alert-dialog-icon"]')?.className).toEqual(
      expect.stringContaining("alert-dialog__icon--danger"),
    );
    unmount();

    render(<Example status="success" />);
    await open(user);
    expect(document.querySelector('[data-slot="alert-dialog-icon"]')?.className).toEqual(
      expect.stringContaining("alert-dialog__icon--success"),
    );
  });

  it("renders custom icon children instead of the default icon", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Icon>
                <span>custom</span>
              </AlertDialog.Icon>
              <AlertDialog.Heading>Custom</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    expect(screen.getByText("custom")).toBeInTheDocument();
    expect(document.querySelector('[data-slot="alert-dialog-default-icon"]')).toBeNull();
  });

  it("marks placement on the container and the dialog", async () => {
    render(<Example placement="top" />);

    await open(user);

    expect(document.querySelector('[data-slot="alert-dialog-container"]')).toHaveAttribute(
      "data-placement",
      "top",
    );
    expect(document.querySelector('[data-slot="alert-dialog-dialog"]')).toHaveAttribute(
      "data-placement",
      "top",
    );
  });

  it("marks size and backdrop variant with modifier classes", async () => {
    render(
      <AlertDialog defaultOpen>
        <AlertDialog.Backdrop variant="blur">
          <AlertDialog.Container size="sm">
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Modifiers</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    expect(document.querySelector('[data-slot="alert-dialog-dialog"]')?.className).toEqual(
      expect.stringContaining("alert-dialog__dialog--sm"),
    );
    expect(document.querySelector('[data-slot="alert-dialog-backdrop"]')?.className).toEqual(
      expect.stringContaining("alert-dialog__backdrop--blur"),
    );
  });

  it("is controlled through state from useOverlayState", async () => {
    const Stateful = () => {
      const state = useOverlayState();

      return (
        <>
          <Button onPress={state.open}>From state</Button>
          <AlertDialog state={state}>
            <AlertDialog.Backdrop>
              <AlertDialog.Container>
                <AlertDialog.Dialog>
                  <AlertDialog.Heading>Stateful</AlertDialog.Heading>
                </AlertDialog.Dialog>
              </AlertDialog.Container>
            </AlertDialog.Backdrop>
          </AlertDialog>
        </>
      );
    };

    render(<Stateful />);

    expect(screen.queryByRole("alertdialog")).toBeNull();

    await user.click(screen.getByRole("button", {name: "From state"}));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("calls onOpenChange on open and close", async () => {
    const onOpenChange = vi.fn();

    render(
      <AlertDialog onOpenChange={onOpenChange}>
        <Button>Open</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Events</AlertDialog.Heading>
              <Button slot="close">Done</Button>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    await open(user);
    await user.click(screen.getByRole("button", {name: "Done"}));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, true);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
  });

  it("opens from its own trigger part", async () => {
    render(
      <AlertDialog>
        <AlertDialog.Trigger aria-label="Remove">
          <span>trigger</span>
        </AlertDialog.Trigger>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Remove?</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );

    expect(document.querySelector('[data-slot="alert-dialog-trigger"]')).not.toBeNull();

    await user.click(screen.getByRole("button", {name: "Remove"}));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });

  it("behaves identically as AlertDialog.Root and AlertDialogRoot", async () => {
    render(
      <>
        <AlertDialogRoot defaultOpen>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog aria-label="Flat" />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialogRoot>
        <AlertDialog.Root defaultOpen>
          <AlertDialog.Backdrop>
            <AlertDialog.Container>
              <AlertDialog.Dialog aria-label="Namespaced" />
            </AlertDialog.Container>
          </AlertDialog.Backdrop>
        </AlertDialog.Root>
      </>,
    );

    expect(screen.getByRole("alertdialog", {hidden: true, name: "Flat"})).toBeInTheDocument();
    expect(screen.getByRole("alertdialog", {hidden: true, name: "Namespaced"})).toBeInTheDocument();
  });
});

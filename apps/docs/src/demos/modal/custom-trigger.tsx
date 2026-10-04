import {Gear} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

export function CustomTrigger() {
  return (
    <Modal>
      <Modal.Trigger className="group flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-xs select-none hover:bg-surface-secondary">
        <div className="bg-accent-soft text-accent-soft-foreground flex size-12 shrink-0 items-center justify-center rounded-xl">
          <Gear className="size-6" />
        </div>
        <div className="flex flex-1 flex-col gap-0.5">
          <p className="text-sm font-semibold">Settings</p>
          <p className="text-xs text-muted">Manage your preferences</p>
        </div>
      </Modal.Trigger>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Settings</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                Modal.Trigger turns any block into the dialog trigger — a card with icon and text.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button slot="close">Save</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

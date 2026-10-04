import {CircleInfo} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

export function DismissBehavior() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Modal>
        <Button variant="secondary">isDismissable = false</Button>
        <Modal.Backdrop isDismissable={false}>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <CircleInfo className="size-5" />
                </Modal.Icon>
                <Modal.Heading>isDismissable = false</Modal.Heading>
                <p className="text-sm leading-5 text-muted">
                  Clicking the backdrop will not close this modal
                </p>
              </Modal.Header>
              <Modal.Body>
                <p>Dismiss only with the close button or Escape.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" slot="close">
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      <Modal>
        <Button variant="secondary">isKeyboardDismissDisabled</Button>
        <Modal.Backdrop isKeyboardDismissDisabled>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground">
                  <CircleInfo className="size-5" />
                </Modal.Icon>
                <Modal.Heading>isKeyboardDismissDisabled = true</Modal.Heading>
                <p className="text-sm leading-5 text-muted">The ESC key is disabled</p>
              </Modal.Header>
              <Modal.Body>
                <p>Dismiss only with the close button or by clicking the backdrop.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button className="w-full" slot="close">
                  Close
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

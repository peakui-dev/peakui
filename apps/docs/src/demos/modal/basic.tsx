import {Rocket} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

export function Basic() {
  return (
    <Modal>
      <Button variant="secondary">Open modal</Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-default text-foreground">
                <Rocket className="size-5" />
              </Modal.Icon>
              <Modal.Heading>Welcome to PeakUI</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>A modal dialog locks the page behind a backdrop until dismissed.</p>
            </Modal.Body>
            <Modal.Footer>
              <Button className="w-full" slot="close">
                Continue
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

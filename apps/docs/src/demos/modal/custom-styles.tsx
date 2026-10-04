import {Button, Modal} from "@peakui/react";

export function CustomStyles() {
  return (
    <Modal>
      <Button variant="secondary">Open modal</Button>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="rounded-none border border-border shadow-none">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Sharp corners</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                <code>rounded-none border border-border shadow-none</code> on Modal.Dialog — plain
                Tailwind utilities compose with the component classes.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close">Close</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

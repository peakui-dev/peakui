import {Button, Modal} from "@peakui/react";

const SIZES = ["xs", "sm", "md", "lg", "cover", "full"] as const;

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {SIZES.map((size) => (
        <Modal key={size}>
          <Button variant="secondary">{size}</Button>
          <Modal.Backdrop>
            <Modal.Container size={size}>
              <Modal.Dialog>
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Size: {size}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    On mobile every size spans the width; on desktop each caps its own max-width.
                  </p>
                </Modal.Body>
                <Modal.Footer>
                  <Button slot="close" variant="secondary">
                    Cancel
                  </Button>
                  <Button slot="close">Confirm</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ))}
    </div>
  );
}

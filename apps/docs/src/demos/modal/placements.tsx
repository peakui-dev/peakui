import {Button, Modal} from "@peakui/react";

const PLACEMENTS = ["auto", "top", "center", "bottom"] as const;

export function Placements() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {PLACEMENTS.map((placement) => (
        <Modal key={placement}>
          <Button variant="secondary">{placement}</Button>
          <Modal.Backdrop>
            <Modal.Container placement={placement}>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Placement: {placement}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    The container positions the dialog at the chosen screen edge; <code>auto</code>{" "}
                    follows the platform sheet convention.
                  </p>
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
      ))}
    </div>
  );
}

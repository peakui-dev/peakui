import {Button, Modal} from "@peakui/react";

const VARIANTS = ["opaque", "blur", "transparent"] as const;

export function BackdropVariants() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {VARIANTS.map((variant) => (
        <Modal key={variant}>
          <Button variant="secondary">{variant}</Button>
          <Modal.Backdrop variant={variant}>
            <Modal.Container>
              <Modal.Dialog className="sm:max-w-[360px]">
                <Modal.CloseTrigger />
                <Modal.Header>
                  <Modal.Heading>Backdrop: {variant}</Modal.Heading>
                </Modal.Header>
                <Modal.Body>
                  <p>
                    <code>opaque</code> dims the page, <code>blur</code> adds a backdrop filter,{" "}
                    <code>transparent</code> removes the overlay.
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

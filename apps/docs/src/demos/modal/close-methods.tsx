"use client";

import {CircleCheck, CircleInfo} from "@gravity-ui/icons";
import {Button, Modal} from "@peakui/react";

export function CloseMethods() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Modal>
        <Button variant="secondary">slot=&quot;close&quot;</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.Header>
                <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
                  <CircleInfo className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Using slot=&quot;close&quot;</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>Any button with slot=&quot;close&quot; inside the dialog closes the modal.</p>
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

      <Modal>
        <Button variant="secondary">Dialog render props</Button>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[360px]">
              {(renderProps) => (
                <>
                  <Modal.Header>
                    <Modal.Icon className="bg-success-soft text-success-soft-foreground">
                      <CircleCheck className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Using Dialog render props</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p>The close method from render props runs your logic before dismissing.</p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button variant="secondary" onPress={() => renderProps.close()}>
                      Cancel
                    </Button>
                    <Button onPress={() => renderProps.close()}>Confirm</Button>
                  </Modal.Footer>
                </>
              )}
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

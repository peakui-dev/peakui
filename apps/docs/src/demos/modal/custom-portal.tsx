"use client";

import {Button, Modal} from "@peakui/react";
import {useCallback, useRef, useState} from "react";

export function CustomPortal() {
  const portalRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  const setPortalRef = useCallback((node: HTMLDivElement | null) => {
    portalRef.current = node;
    setPortalContainer(node);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm">
          Render modals inside a custom container instead of <code>document.body</code>.
        </p>
        <p className="text-sm text-muted">
          Give the container a new stacking context, e.g.{" "}
          <code className="rounded px-1 py-0.5 text-xs">transform: translateZ(0)</code>.
        </p>
      </div>
      <div
        ref={setPortalRef}
        className="relative flex h-[380px] items-center justify-center overflow-hidden rounded bg-muted/20"
        /* new stacking context */
        style={{transform: "translate(0)"}}
      >
        {!!portalContainer && (
          <Modal>
            <Button>Open modal</Button>
            <Modal.Backdrop className="h-full" UNSTABLE_portalContainer={portalContainer}>
              <Modal.Container className="h-full max-h-full">
                <Modal.Dialog className="h-full max-h-full sm:max-w-md">
                  <Modal.CloseTrigger />
                  <Modal.Header>
                    <Modal.Heading>Custom portal</Modal.Heading>
                  </Modal.Header>
                  <Modal.Body>
                    <p className="text-sm text-muted">
                      The dialog lives inside the dedicated area of the page, not in body.
                    </p>
                    <p className="text-sm text-muted">
                      Long content scrolls within the dialog body, and the area boundary stays
                      visible.
                    </p>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" variant="secondary">
                      Close
                    </Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        )}
      </div>
    </div>
  );
}

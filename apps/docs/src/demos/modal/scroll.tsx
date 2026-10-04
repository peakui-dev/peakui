"use client";

import {Button, Modal} from "@peakui/react";
import {useState} from "react";

export function Scroll() {
  const [scroll, setScroll] = useState<"inside" | "outside">("inside");

  return (
    <div className="flex flex-col items-start gap-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={scroll === "inside" ? "primary" : "tertiary"}
          onPress={() => setScroll("inside")}
        >
          Inside
        </Button>
        <Button
          size="sm"
          variant={scroll === "outside" ? "primary" : "tertiary"}
          onPress={() => setScroll("outside")}
        >
          Outside
        </Button>
      </div>
      <Modal>
        <Button variant="secondary">Open modal ({scroll})</Button>
        <Modal.Backdrop>
          <Modal.Container scroll={scroll}>
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Scroll: {scroll}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                {Array.from({length: 12}).map((_, i) => (
                  <p key={i} className="mb-3">
                    Paragraph {i + 1}: inside scrolls the dialog body, outside scrolls the whole
                    backdrop with the dialog.
                  </p>
                ))}
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
    </div>
  );
}

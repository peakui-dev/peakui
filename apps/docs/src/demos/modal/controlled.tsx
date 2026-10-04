"use client";

import {Button, Modal, useOverlayState} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const state = useOverlayState();

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-xs text-muted">
          useState: <span className="font-mono font-medium text-foreground">{String(isOpen)}</span>
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={() => setIsOpen(true)}>
            Open modal
          </Button>
          <Button size="sm" variant="tertiary" onPress={() => setIsOpen(!isOpen)}>
            Toggle
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm">
        <p className="text-xs text-muted">
          useOverlayState:{" "}
          <span className="font-mono font-medium text-foreground">{String(state.isOpen)}</span>
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onPress={state.open}>
            Open modal
          </Button>
          <Button size="sm" variant="tertiary" onPress={state.toggle}>
            Toggle
          </Button>
        </div>
      </div>

      <Modal.Backdrop isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Controlled with useState()</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>Pass isOpen and onOpenChange to Modal.Backdrop to manage the state externally.</p>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={state.isOpen} onOpenChange={state.setOpen}>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Controlled with useOverlayState()</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                The hook offers open(), close() and toggle(), or feeds the Root via the state prop.
              </p>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}

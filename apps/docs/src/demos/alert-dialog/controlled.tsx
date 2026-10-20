"use client";

import {AlertDialog, Button, useOverlayState} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [isOpen, setIsOpen] = useState(false);
  const state = useOverlayState();

  return (
    <div className="flex flex-wrap gap-4">
      <AlertDialog isOpen={isOpen} onOpenChange={setIsOpen}>
        <Button variant="secondary">Open with useState</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              <AlertDialog.Heading>Controlled with useState</AlertDialog.Heading>
              <Button slot="close">Close</Button>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
      <AlertDialog state={state}>
        <Button variant="secondary">Open with useOverlayState</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              <AlertDialog.Heading>Controlled with useOverlayState</AlertDialog.Heading>
              <Button slot="close">Close</Button>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}

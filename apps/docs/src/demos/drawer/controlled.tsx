"use client";

import {Button, Drawer, useOverlayState} from "@peakui/react";

export function Controlled() {
  const state = useOverlayState();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <p className="text-xs text-muted">
        isOpen:{" "}
        <span className="font-mono font-medium text-foreground">{String(state.isOpen)}</span>
      </p>
      <Button variant="secondary" onPress={state.open}>
        Open drawer
      </Button>
      <Drawer state={state}>
        <Drawer.Backdrop>
          <Drawer.Content placement="left">
            <Drawer.Dialog>
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Controlled</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                <p>The open state lives in the parent, not in the drawer.</p>
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </div>
  );
}

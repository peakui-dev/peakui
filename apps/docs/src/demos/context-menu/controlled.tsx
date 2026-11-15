"use client";

import {Button, ContextMenu, Label} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [isOpen, setOpen] = useState(false);

  return (
    <div className="flex flex-col items-start gap-4">
      <p className="text-sm text-muted">
        Menu: <strong>{isOpen ? "open" : "closed"}</strong>
      </p>
      <Button variant="secondary" onPress={() => setOpen((current) => !current)}>
        Toggle menu
      </Button>
      <ContextMenu isOpen={isOpen} onOpenChange={setOpen}>
        <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
          Right-click this region
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
    </div>
  );
}

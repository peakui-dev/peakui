"use client";

import type {Key} from "react";

import {Button, ContextMenu, Dropdown, Label} from "@peakui/react";

export function Basic() {
  const onAction = (key: Key) => console.log(`Selected: ${String(key)}`);

  return (
    <div className="flex flex-col items-start gap-4">
      <ContextMenu>
        <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
          Right-click this region
        </ContextMenu.Trigger>
        <ContextMenu.Popover>
          <ContextMenu.Menu aria-label="Actions" onAction={onAction}>
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
          </ContextMenu.Menu>
        </ContextMenu.Popover>
      </ContextMenu>
      {/* A context menu is never the only path to an action: the same actions stay visible. */}
      <Dropdown>
        <Button aria-label="Actions menu" variant="secondary">
          Actions
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu onAction={onAction}>
            <Dropdown.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </Dropdown.Item>
            <Dropdown.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}

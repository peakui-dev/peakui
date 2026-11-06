import {ContextMenu, Label} from "@peakui/react";

export function Basic() {
  return (
    <ContextMenu>
      <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
        Region
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu aria-label="Actions">
          <ContextMenu.Item id="copy" textValue="Copy">
            <Label>Copy</Label>
          </ContextMenu.Item>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

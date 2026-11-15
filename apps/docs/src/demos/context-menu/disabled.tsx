import {ContextMenu, Label} from "@peakui/react";

export function Disabled() {
  return (
    <ContextMenu isDisabled>
      <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
        Right-click this region: the browser menu stays
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

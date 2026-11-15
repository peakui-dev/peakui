import {ContextMenu, Label} from "@peakui/react";

export function WithSections() {
  return (
    <ContextMenu>
      <ContextMenu.Trigger className="rounded-lg border border-dashed p-12">
        Right-click this region
      </ContextMenu.Trigger>
      <ContextMenu.Popover>
        <ContextMenu.Menu aria-label="Actions">
          <ContextMenu.Section aria-label="Edit">
            <ContextMenu.Item id="copy" textValue="Copy">
              <Label>Copy</Label>
            </ContextMenu.Item>
            <ContextMenu.Item id="paste" textValue="Paste">
              <Label>Paste</Label>
            </ContextMenu.Item>
          </ContextMenu.Section>
          <ContextMenu.Section aria-label="Danger zone">
            <ContextMenu.Item id="delete" textValue="Delete" variant="danger">
              <Label>Delete</Label>
            </ContextMenu.Item>
          </ContextMenu.Section>
        </ContextMenu.Menu>
      </ContextMenu.Popover>
    </ContextMenu>
  );
}

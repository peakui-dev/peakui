import {ContextMenu, Label} from "@peakui/react";

export function WithNativeEscape() {
  return (
    <ContextMenu>
      <ContextMenu.Trigger
        aria-label="Region with a link"
        className="flex flex-col gap-3 rounded-lg border border-dashed p-12"
        role="group"
      >
        <span>Right-click here for the custom menu.</span>
        <a data-context-menu-native className="underline" href="https://example.com">
          Right-click this link for the browser menu
        </a>
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
  );
}

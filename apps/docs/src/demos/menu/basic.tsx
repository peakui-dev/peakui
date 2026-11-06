import {Label, Menu} from "@peakui/react";

export function Basic() {
  return (
    <div className="w-60">
      <Menu aria-label="Actions">
        <Menu.Item id="new" textValue="New file">
          <Label>New file</Label>
        </Menu.Item>
        <Menu.Item id="open" textValue="Open">
          <Label>Open</Label>
        </Menu.Item>
        <Menu.Item id="rename" textValue="Rename">
          <Label>Rename</Label>
        </Menu.Item>
      </Menu>
    </div>
  );
}

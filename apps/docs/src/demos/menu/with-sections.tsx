import {Label, Menu, Separator} from "@peakui/react";

export function WithSections() {
  return (
    <div className="w-60">
      <Menu aria-label="Actions">
        <Menu.Section aria-label="File">
          <Menu.Item id="new" textValue="New file">
            <Label>New file</Label>
          </Menu.Item>
          <Menu.Item id="open" textValue="Open">
            <Label>Open</Label>
          </Menu.Item>
        </Menu.Section>
        <Separator />
        <Menu.Section aria-label="Danger zone">
          <Menu.Item id="delete" textValue="Delete" variant="danger">
            <Label>Delete</Label>
          </Menu.Item>
        </Menu.Section>
      </Menu>
    </div>
  );
}

import {Label, Menu} from "@peakui/react";

export function WithSelection() {
  return (
    <div className="w-60">
      <Menu aria-label="Text style" defaultSelectedKeys={["bold"]} selectionMode="multiple">
        <Menu.Item id="bold" textValue="Bold">
          <Label>Bold</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
        <Menu.Item id="italic" textValue="Italic">
          <Label>Italic</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
        <Menu.Item id="underline" textValue="Underline">
          <Label>Underline</Label>
          <Menu.ItemIndicator />
        </Menu.Item>
      </Menu>
    </div>
  );
}

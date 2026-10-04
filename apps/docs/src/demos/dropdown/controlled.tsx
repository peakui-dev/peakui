"use client";

import {Button, Dropdown, Label} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [selected, setSelected] = useState<"all" | Set<string | number>>(new Set(["bold"]));
  const selectedItems = Array.from(selected === "all" ? [] : selected);

  return (
    <div className="min-w-sm space-y-4">
      <Dropdown>
        <Button aria-label="Menu" variant="secondary">
          Actions
        </Button>
        <Dropdown.Popover>
          <Dropdown.Menu
            selectedKeys={selected}
            selectionMode="multiple"
            onSelectionChange={setSelected}
          >
            <Dropdown.Item id="bold" textValue="Bold">
              <Label>Bold</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
            <Dropdown.Item id="italic" textValue="Italic">
              <Label>Italic</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
            <Dropdown.Item id="underline" textValue="Underline">
              <Label>Underline</Label>
              <Dropdown.ItemIndicator />
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
      <p className="text-sm text-muted">
        Selected: {selectedItems.length > 0 ? selectedItems.join(", ") : "None"}
      </p>
    </div>
  );
}

"use client";

import {Button, Dropdown, Label} from "@peakui/react";
import {useState} from "react";

export function WithMultipleSelection() {
  const [selected, setSelected] = useState<"all" | Set<string | number>>(new Set(["apple"]));

  return (
    <Dropdown>
      <Button aria-label="Menu" variant="secondary">
        Preferred Fruits
      </Button>
      <Dropdown.Popover className="min-w-64">
        <Dropdown.Menu
          selectedKeys={selected}
          selectionMode="multiple"
          onSelectionChange={setSelected}
        >
          <Dropdown.Section>
            <Dropdown.Item id="apple" textValue="Apple">
              <Dropdown.ItemIndicator />
              <Label>Apple</Label>
            </Dropdown.Item>
            <Dropdown.Item id="banana" textValue="Banana">
              <Dropdown.ItemIndicator />
              <Label>Banana</Label>
            </Dropdown.Item>
            <Dropdown.Item id="cherry" textValue="Cherry">
              <Dropdown.ItemIndicator />
              <Label>Cherry</Label>
            </Dropdown.Item>
          </Dropdown.Section>
          <Dropdown.Item id="orange" textValue="Orange">
            <Dropdown.ItemIndicator />
            <Label>Orange</Label>
          </Dropdown.Item>
          <Dropdown.Item id="pear" textValue="Pear">
            <Dropdown.ItemIndicator />
            <Label>Pear</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

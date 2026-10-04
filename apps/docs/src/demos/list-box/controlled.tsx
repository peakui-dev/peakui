"use client";

import type {ListBoxProps} from "@peakui/react";

import {Check} from "@gravity-ui/icons";
import {Description, Label, ListBox, Surface} from "@peakui/react";
import {useState} from "react";

/* The selection type as the listbox itself declares it, so the state and the handler agree. */
type SelectedKeys = Parameters<NonNullable<ListBoxProps<object>["onSelectionChange"]>>[0];

export function Controlled() {
  const [selected, setSelected] = useState<SelectedKeys>(new Set(["1"]));

  const selectedItems = selected === "all" ? "All" : [...selected].join(", ");

  return (
    <div className="space-y-4">
      <Surface className="w-[256px] rounded-3xl shadow-surface">
        <ListBox
          aria-label="Users"
          selectedKeys={selected}
          selectionMode="multiple"
          onSelectionChange={setSelected}
        >
          <ListBox.Item id="1" textValue="Bob">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
              B
            </span>
            <div className="flex flex-col">
              <Label>Bob</Label>
              <Description>bob@peakui.dev</Description>
            </div>
            <ListBox.ItemIndicator>
              {({isSelected}) =>
                isSelected ? <Check className="size-4 text-accent-soft-foreground" /> : null
              }
            </ListBox.ItemIndicator>
          </ListBox.Item>
          <ListBox.Item id="2" textValue="Fred">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
              F
            </span>
            <div className="flex flex-col">
              <Label>Fred</Label>
              <Description>fred@peakui.dev</Description>
            </div>
            <ListBox.ItemIndicator>
              {({isSelected}) =>
                isSelected ? <Check className="size-4 text-accent-soft-foreground" /> : null
              }
            </ListBox.ItemIndicator>
          </ListBox.Item>
          <ListBox.Item id="3" textValue="Martha">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
              M
            </span>
            <div className="flex flex-col">
              <Label>Martha</Label>
              <Description>martha@peakui.dev</Description>
            </div>
            <ListBox.ItemIndicator>
              {({isSelected}) =>
                isSelected ? <Check className="size-4 text-accent-soft-foreground" /> : null
              }
            </ListBox.ItemIndicator>
          </ListBox.Item>
        </ListBox>
      </Surface>
      <p className="text-sm text-muted">
        Selected: {selectedItems.length > 0 ? selectedItems : "None"}
      </p>
    </div>
  );
}

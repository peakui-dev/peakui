"use client";

import {Description, Label, ListBox} from "@peakui/react";

export function RenderFunction() {
  return (
    <ListBox
      aria-label="Users"
      className="w-[220px]"
      render={(props) => <div {...props} data-custom="true" />}
      selectionMode="single"
    >
      <ListBox.Item
        id="1"
        render={(props) => <span {...props} data-custom="foo" />}
        textValue="Bob"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
          B
        </span>
        <div className="flex flex-col">
          <Label>Bob</Label>
          <Description>bob@peakui.dev</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item
        id="2"
        render={(props) => <span {...props} data-custom="bar" />}
        textValue="Fred"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
          F
        </span>
        <div className="flex flex-col">
          <Label>Fred</Label>
          <Description>fred@peakui.dev</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
      <ListBox.Item
        id="3"
        render={(props) => <span {...props} data-custom="baz" />}
        textValue="Martha"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-xs font-medium text-surface-secondary-foreground">
          M
        </span>
        <div className="flex flex-col">
          <Label>Martha</Label>
          <Description>martha@peakui.dev</Description>
        </div>
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>
  );
}

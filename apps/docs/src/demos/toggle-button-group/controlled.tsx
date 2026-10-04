"use client";

import type {ToggleButtonGroupProps} from "@peakui/react";

import {Bold, Italic, Strikethrough, Underline} from "@gravity-ui/icons";
import {ToggleButton, ToggleButtonGroup} from "@peakui/react";
import {useState} from "react";

/* The selection type as the group itself declares it, so the state and the handler agree. */
type SelectedKeys = Parameters<NonNullable<ToggleButtonGroupProps["onSelectionChange"]>>[0];

export function Controlled() {
  const [selectedKeys, setSelectedKeys] = useState<SelectedKeys>(new Set(["bold"]));

  return (
    <div className="flex flex-col items-center gap-3">
      <ToggleButtonGroup
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        onSelectionChange={setSelectedKeys}
      >
        <ToggleButton isIconOnly aria-label="Bold" id="bold">
          <Bold />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Italic" id="italic">
          <ToggleButtonGroup.Separator />
          <Italic />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Underline" id="underline">
          <ToggleButtonGroup.Separator />
          <Underline />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Strikethrough" id="strikethrough">
          <ToggleButtonGroup.Separator />
          <Strikethrough />
        </ToggleButton>
      </ToggleButtonGroup>
      <p className="text-sm text-muted">
        Selected: {selectedKeys.size > 0 ? [...selectedKeys].join(", ") : "None"}
      </p>
    </div>
  );
}

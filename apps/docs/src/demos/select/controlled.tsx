"use client";

import {Label, ListBox, Select} from "@peakui/react";
import React from "react";

const STATES = [
  {id: "california", name: "California"},
  {id: "texas", name: "Texas"},
  {id: "florida", name: "Florida"},
];

export function Controlled() {
  const [state, setState] = React.useState<string | number | null>("california");

  const selectedState = STATES.find((s) => s.id === state);

  return (
    <div className="space-y-2">
      <Select
        className="w-[256px]"
        placeholder="Select a state"
        value={state}
        onChange={(value) => setState(value)}
      >
        <Label>State (controlled)</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {STATES.map((state) => (
              <ListBox.Item key={state.id} id={state.id} textValue={state.name}>
                {state.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      <p className="text-sm text-muted">Selected: {selectedState?.name || "None"}</p>
    </div>
  );
}

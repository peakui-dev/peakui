"use client";

import {Checkbox} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [isSelected, setIsSelected] = useState(true);

  return (
    <div className="flex flex-col gap-3">
      <Checkbox isSelected={isSelected} onChange={setIsSelected}>
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Email notifications
        </Checkbox.Content>
      </Checkbox>
      <p className="text-sm text-muted">Status: {isSelected ? "Enabled" : "Disabled"}</p>
    </div>
  );
}

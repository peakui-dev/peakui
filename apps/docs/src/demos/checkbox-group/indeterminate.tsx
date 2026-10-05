"use client";

import {Checkbox, CheckboxGroup} from "@peakui/react";
import {useState} from "react";

const ALL = ["coding", "design", "writing"] as const;

export function Indeterminate() {
  const [selected, setSelected] = useState<string[]>(["coding"]);

  return (
    <div>
      <Checkbox
        isIndeterminate={selected.length > 0 && selected.length < ALL.length}
        isSelected={selected.length === ALL.length}
        name="select-all"
        onChange={(isSelected: boolean) => {
          setSelected(isSelected ? [...ALL] : []);
        }}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          Select all
        </Checkbox.Content>
      </Checkbox>
      <div className="ms-6 flex flex-col gap-2">
        <CheckboxGroup value={selected} onChange={setSelected}>
          {ALL.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                {value}
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>
    </div>
  );
}

"use client";

import {SegmentedControl} from "@peakui/react";
import {useState} from "react";

export function Controlled() {
  const [view, setView] = useState("grid");

  return (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl
        aria-label="View"
        selectedKey={view}
        onSelectionChange={(key) => setView(String(key))}
      >
        <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item id="list">List</SegmentedControl.Item>
        <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
      </SegmentedControl>
      <p className="text-sm text-muted">Selected: {view}</p>
    </div>
  );
}

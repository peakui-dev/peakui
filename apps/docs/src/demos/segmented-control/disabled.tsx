import {SegmentedControl} from "@peakui/react";

export function Disabled() {
  return (
    <div className="flex flex-col items-start gap-4">
      <SegmentedControl isDisabled aria-label="Whole control disabled" defaultSelectedKey="grid">
        <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item id="list">List</SegmentedControl.Item>
      </SegmentedControl>
      <SegmentedControl aria-label="One segment disabled" defaultSelectedKey="grid">
        <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
        <SegmentedControl.Item isDisabled id="list">
          List
        </SegmentedControl.Item>
        <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
      </SegmentedControl>
    </div>
  );
}

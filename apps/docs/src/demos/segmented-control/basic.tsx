import {SegmentedControl} from "@peakui/react";

export function Basic() {
  return (
    <SegmentedControl aria-label="View" defaultSelectedKey="grid">
      <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
      <SegmentedControl.Item id="list">List</SegmentedControl.Item>
      <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
    </SegmentedControl>
  );
}

import {SegmentedControl} from "@peakui/react";

const sizes = ["sm", "md", "lg"] as const;

export function Sizes() {
  return (
    <div className="flex flex-col items-start gap-4">
      {sizes.map((size) => (
        <SegmentedControl
          key={size}
          aria-label={`View, size ${size}`}
          defaultSelectedKey="grid"
          size={size}
        >
          <SegmentedControl.Item id="grid">Grid</SegmentedControl.Item>
          <SegmentedControl.Item id="list">List</SegmentedControl.Item>
          <SegmentedControl.Item id="table">Table</SegmentedControl.Item>
        </SegmentedControl>
      ))}
    </div>
  );
}

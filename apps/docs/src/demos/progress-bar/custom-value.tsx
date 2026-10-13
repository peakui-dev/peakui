import {Label, ProgressBar} from "@peakui/react";

export function CustomValue() {
  return (
    <ProgressBar
      className="w-64"
      formatOptions={{currency: "USD", style: "currency"}}
      maxValue={1000}
      minValue={0}
      value={750}
    >
      <Label>Revenue</Label>
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

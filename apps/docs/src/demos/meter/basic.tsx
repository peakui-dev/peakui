import {Label, Meter} from "@peakui/react";

export function Basic() {
  return (
    <Meter className="w-64" value={60}>
      <Label>Storage</Label>
      <Meter.Output />
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  );
}

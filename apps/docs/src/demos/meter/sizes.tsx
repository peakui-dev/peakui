import {Label, Meter} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex w-64 flex-col gap-6">
      <Meter size="sm" value={40}>
        <Label>Small</Label>
        <Meter.Output />
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>
      <Meter size="md" value={60}>
        <Label>Medium</Label>
        <Meter.Output />
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>
      <Meter size="lg" value={80}>
        <Label>Large</Label>
        <Meter.Output />
        <Meter.Track>
          <Meter.Fill />
        </Meter.Track>
      </Meter>
    </div>
  );
}

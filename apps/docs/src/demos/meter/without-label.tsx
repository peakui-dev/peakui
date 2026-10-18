import {Meter} from "@peakui/react";

export function WithoutLabel() {
  return (
    <Meter aria-label="Storage used" className="w-64" value={45}>
      <Meter.Track>
        <Meter.Fill />
      </Meter.Track>
    </Meter>
  );
}

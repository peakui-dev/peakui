import {ProgressCircle} from "@peakui/react";

export function CustomStyles() {
  return (
    <ProgressCircle
      aria-label="Loading"
      className="[--progress-circle-stroke:var(--color-success)]"
      value={60}
    >
      <ProgressCircle.Track className="size-12">
        <ProgressCircle.TrackCircle />
        <ProgressCircle.FillCircle />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

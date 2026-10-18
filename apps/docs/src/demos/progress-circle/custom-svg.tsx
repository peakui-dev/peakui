import {ProgressCircle} from "@peakui/react";

export function CustomSvg() {
  return (
    <ProgressCircle aria-label="Loading" value={60}>
      <ProgressCircle.Track>
        <ProgressCircle.TrackCircle strokeWidth={2} />
        <ProgressCircle.FillCircle strokeWidth={2} />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

import {ProgressCircle} from "@peakui/react";

export function CustomSvg() {
  return (
    <ProgressCircle aria-label="Loading" value={60}>
      <ProgressCircle.Track viewBox="0 0 48 48">
        <ProgressCircle.TrackCircle cx={24} cy={24} r={20} strokeWidth={2} />
        <ProgressCircle.FillCircle cx={24} cy={24} r={20} strokeWidth={2} />
      </ProgressCircle.Track>
    </ProgressCircle>
  );
}

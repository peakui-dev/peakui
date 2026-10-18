import {Label, ProgressCircle} from "@peakui/react";

export function WithLabel() {
  return (
    <div className="flex items-center gap-3">
      <ProgressCircle aria-labelledby="upload-label" value={75}>
        <ProgressCircle.Track>
          <ProgressCircle.TrackCircle />
          <ProgressCircle.FillCircle />
        </ProgressCircle.Track>
      </ProgressCircle>
      <Label id="upload-label">75% complete</Label>
    </div>
  );
}

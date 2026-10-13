import {Label, ProgressBar} from "@peakui/react";

export function Indeterminate() {
  return (
    <ProgressBar isIndeterminate className="w-64">
      <Label>Loading...</Label>
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

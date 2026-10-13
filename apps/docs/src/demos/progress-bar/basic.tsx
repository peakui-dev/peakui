import {Label, ProgressBar} from "@peakui/react";

export function Basic() {
  return (
    <ProgressBar className="w-64" value={60}>
      <Label>Loading</Label>
      <ProgressBar.Output />
      <ProgressBar.Track>
        <ProgressBar.Fill />
      </ProgressBar.Track>
    </ProgressBar>
  );
}

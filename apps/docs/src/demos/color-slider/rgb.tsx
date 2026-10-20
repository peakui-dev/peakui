import {ColorSlider, Label} from "@peakui/react";

export function Rgb() {
  return (
    <div className="w-72">
      <ColorSlider channel="red" colorSpace="rgb" defaultValue="rgb(120, 200, 80)">
        <Label>Red</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </div>
  );
}

import {ColorSlider, Label} from "@peakui/react";

export function Basic() {
  return (
    <div className="w-72">
      <ColorSlider channel="hue" colorSpace="hsb" defaultValue="hsb(210, 100%, 100%)">
        <Label>Hue</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </div>
  );
}

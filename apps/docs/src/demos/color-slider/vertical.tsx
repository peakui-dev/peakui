import {ColorSlider, Label} from "@peakui/react";

export function Vertical() {
  return (
    <div className="h-48">
      <ColorSlider
        channel="hue"
        colorSpace="hsb"
        defaultValue="hsb(210, 100%, 100%)"
        orientation="vertical"
      >
        <Label>Hue</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </div>
  );
}

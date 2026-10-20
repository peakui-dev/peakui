import {ColorSlider, Label} from "@peakui/react";

export function Alpha() {
  return (
    <div className="w-72">
      <ColorSlider channel="alpha" defaultValue="hsb(210, 100%, 100%)">
        <Label>Opacity</Label>
        <ColorSlider.Output />
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </div>
  );
}

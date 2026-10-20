import {ColorSlider} from "@peakui/react";

export function WithoutLabel() {
  return (
    <div className="w-72">
      <ColorSlider
        aria-label="Hue"
        channel="hue"
        colorSpace="hsb"
        defaultValue="hsb(210, 100%, 100%)"
      >
        <ColorSlider.Track>
          <ColorSlider.Thumb />
        </ColorSlider.Track>
      </ColorSlider>
    </div>
  );
}

import {ColorArea} from "@peakui/react";

export function Disabled() {
  return (
    <ColorArea
      isDisabled
      aria-label="Saturation and brightness"
      colorSpace="hsb"
      defaultValue="hsb(210, 100%, 100%)"
      xChannel="saturation"
      yChannel="brightness"
    >
      <ColorArea.Thumb />
    </ColorArea>
  );
}

import {ColorArea} from "@peakui/react";

export function WithDots() {
  return (
    <ColorArea
      showDots
      aria-label="Saturation and brightness"
      colorSpace="hsb"
      defaultValue="hsb(340, 80%, 90%)"
      xChannel="saturation"
      yChannel="brightness"
    >
      <ColorArea.Thumb />
    </ColorArea>
  );
}

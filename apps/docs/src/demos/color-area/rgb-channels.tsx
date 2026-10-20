import {ColorArea} from "@peakui/react";

export function RgbChannels() {
  return (
    <ColorArea
      aria-label="Red and green"
      colorSpace="rgb"
      defaultValue="rgb(120, 200, 80)"
      xChannel="red"
      yChannel="green"
    >
      <ColorArea.Thumb />
    </ColorArea>
  );
}

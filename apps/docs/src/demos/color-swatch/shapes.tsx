import {ColorSwatch} from "@peakui/react";

export function Shapes() {
  return (
    <div className="flex items-center gap-3">
      <ColorSwatch aria-label="Circle" color="#0485F7" shape="circle" />
      <ColorSwatch aria-label="Square" color="#0485F7" shape="square" />
    </div>
  );
}

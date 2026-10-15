"use client";

import {ColorSwatch} from "@peakui/react";

export function RenderFunction() {
  return (
    <div className="flex items-center gap-3">
      <ColorSwatch
        aria-label="Blue"
        color="#0485F7"
        render={(props) => <div {...props} data-custom="blue" />}
      />
      <ColorSwatch
        aria-label="Red"
        color="#EF4444"
        render={(props) => <div {...props} data-custom="red" />}
      />
      <ColorSwatch
        aria-label="Amber"
        color="#F59E0B"
        render={(props) => <div {...props} data-custom="amber" />}
      />
    </div>
  );
}

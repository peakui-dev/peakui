"use client";

import {Button} from "@peakui/react";

export function PressedState() {
  return (
    <Button variant="secondary">
      {({isPressed}) => (isPressed ? "Release to confirm" : "Press and hold")}
    </Button>
  );
}

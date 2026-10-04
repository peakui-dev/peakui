"use client";

import {Heart} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";

export function Basic() {
  return (
    <ToggleButton onChange={(isSelected) => console.log(`Selected: ${isSelected}`)}>
      <Heart />
      Like
    </ToggleButton>
  );
}

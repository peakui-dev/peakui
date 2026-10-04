import {Heart} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToggleButton size="sm">
        <Heart />
        Small
      </ToggleButton>
      <ToggleButton size="md">
        <Heart />
        Medium
      </ToggleButton>
      <ToggleButton size="lg">
        <Heart />
        Large
      </ToggleButton>
    </div>
  );
}

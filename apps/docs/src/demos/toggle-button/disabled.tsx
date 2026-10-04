import {Heart} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";

export function Disabled() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToggleButton isDisabled>
        <Heart />
        Like
      </ToggleButton>
      <ToggleButton defaultSelected isDisabled>
        <Heart />
        Liked
      </ToggleButton>
    </div>
  );
}

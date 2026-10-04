import {Heart} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <ToggleButton>
        <Heart />
        Like
      </ToggleButton>
      <ToggleButton defaultSelected>
        <Heart />
        Liked
      </ToggleButton>
      <ToggleButton variant="ghost">
        <Heart />
        Like
      </ToggleButton>
      <ToggleButton defaultSelected variant="ghost">
        <Heart />
        Liked
      </ToggleButton>
    </div>
  );
}

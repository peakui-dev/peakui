import {Bookmark, Heart} from "@gravity-ui/icons";
import {ToggleButton} from "@peakui/react";

export function IconOnly() {
  return (
    <div className="flex items-center gap-3">
      <ToggleButton isIconOnly aria-label="Like">
        <Heart />
      </ToggleButton>
      <ToggleButton isIconOnly aria-label="Save" variant="ghost">
        <Bookmark />
      </ToggleButton>
    </div>
  );
}

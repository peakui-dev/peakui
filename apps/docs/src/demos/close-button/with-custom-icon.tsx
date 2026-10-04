import {CircleXmark} from "@gravity-ui/icons";
import {CloseButton} from "@peakui/react";

export function WithCustomIcon() {
  return (
    <div className="flex items-center gap-3">
      {/* Children replace the default glyph; the label changes only through aria-label. */}
      <CloseButton aria-label="Reset filter">
        <CircleXmark />
      </CloseButton>
      <CloseButton />
    </div>
  );
}

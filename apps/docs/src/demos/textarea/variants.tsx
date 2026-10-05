import {TextArea} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex w-[280px] flex-col gap-2">
      <TextArea fullWidth aria-label="Primary" placeholder="Primary textarea" variant="primary" />
      <TextArea
        fullWidth
        aria-label="Secondary"
        placeholder="Secondary textarea"
        variant="secondary"
      />
    </div>
  );
}

import {Chip} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Chip color="accent" variant="primary">
        Primary
      </Chip>
      <Chip color="accent" variant="secondary">
        Secondary
      </Chip>
      <Chip color="accent" variant="tertiary">
        Tertiary
      </Chip>
      <Chip color="accent" variant="soft">
        Soft
      </Chip>
    </div>
  );
}

import {Chip} from "@peakui/react";

export function Colors() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Chip color="default" variant="soft">
        Default
      </Chip>
      <Chip color="accent" variant="soft">
        Accent
      </Chip>
      <Chip color="success" variant="soft">
        Success
      </Chip>
      <Chip color="warning" variant="soft">
        Warning
      </Chip>
      <Chip color="danger" variant="soft">
        Danger
      </Chip>
    </div>
  );
}

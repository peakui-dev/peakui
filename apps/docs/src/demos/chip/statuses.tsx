import {CircleFill} from "@gravity-ui/icons";
import {Chip} from "@peakui/react";

export function Statuses() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Chip color="accent" variant="soft">
        <CircleFill aria-hidden height={6} width={6} />
        <Chip.Label>Information</Chip.Label>
      </Chip>
      <Chip color="success" variant="soft">
        <CircleFill aria-hidden height={6} width={6} />
        <Chip.Label>Completed</Chip.Label>
      </Chip>
      <Chip color="warning" variant="soft">
        <CircleFill aria-hidden height={6} width={6} />
        <Chip.Label>Pending</Chip.Label>
      </Chip>
      <Chip color="danger" variant="soft">
        <CircleFill aria-hidden height={6} width={6} />
        <Chip.Label>Failed</Chip.Label>
      </Chip>
    </div>
  );
}

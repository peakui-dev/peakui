import {CircleFill} from "@gravity-ui/icons";
import {Chip} from "@peakui/react";

const STATUSES = [
  {children: "Information", color: "accent"},
  {children: "Completed", color: "success"},
  {children: "Pending", color: "warning"},
  {children: "Failed", color: "danger"},
] as const;

export function Statuses() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {STATUSES.map(({children, color}) => (
        <Chip key={color} color={color} variant="soft">
          <CircleFill aria-hidden height={6} width={6} />
          <Chip.Label>{children}</Chip.Label>
        </Chip>
      ))}
    </div>
  );
}

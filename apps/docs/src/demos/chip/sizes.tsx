import {Chip} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Chip size="sm">Small</Chip>
      <Chip size="md">Medium</Chip>
      <Chip size="lg">Large</Chip>
    </div>
  );
}

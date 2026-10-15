import {ColorSwatch} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex items-center gap-3">
      <ColorSwatch aria-label="Extra small" color="#0485F7" size="xs" />
      <ColorSwatch aria-label="Small" color="#EF4444" size="sm" />
      <ColorSwatch aria-label="Medium" color="#F59E0B" size="md" />
      <ColorSwatch aria-label="Large" color="#10B981" size="lg" />
      <ColorSwatch aria-label="Extra large" color="#D946EF" size="xl" />
    </div>
  );
}

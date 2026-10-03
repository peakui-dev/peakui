import {Spinner} from "@peakui/react";

export function Sizes() {
  return (
    <div className="flex items-center gap-6">
      <Spinner aria-label="Loading, small" size="sm" />
      <Spinner aria-label="Loading, medium" size="md" />
      <Spinner aria-label="Loading, large" size="lg" />
      <Spinner aria-label="Loading, extra large" size="xl" />
    </div>
  );
}

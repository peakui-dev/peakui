import {Spinner} from "@peakui/react";

export function Colors() {
  return (
    <div className="flex items-center gap-6">
      <Spinner aria-label="Loading, current color" color="current" />
      <Spinner aria-label="Loading, accent" color="accent" />
      <Spinner aria-label="Loading, success" color="success" />
      <Spinner aria-label="Loading, warning" color="warning" />
      <Spinner aria-label="Loading, danger" color="danger" />
    </div>
  );
}

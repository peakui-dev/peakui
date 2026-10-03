import {Spinner} from "@peakui/react";

export function CustomLabel() {
  return (
    <div className="flex items-center gap-3 text-sm text-muted">
      <Spinner aria-label="Uploading the file" size="sm" />
      Uploading the file
    </div>
  );
}

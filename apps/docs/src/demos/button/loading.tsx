import {Button, Spinner} from "@peakui/react";

export function Loading() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button isPending>
        <Spinner aria-hidden color="current" size="sm" />
        Saving
      </Button>
      <Button isPending variant="tertiary">
        <Spinner aria-hidden color="current" size="sm" />
        Loading
      </Button>
    </div>
  );
}

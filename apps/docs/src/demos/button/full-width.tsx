import {Button} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button fullWidth>Save</Button>
      <Button fullWidth variant="tertiary">
        Cancel
      </Button>
    </div>
  );
}

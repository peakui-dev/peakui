import {Label} from "@peakui/react";

export function States() {
  return (
    <div className="flex flex-col gap-3">
      <Label>Default</Label>
      <Label isRequired>Required</Label>
      <Label isInvalid>Invalid</Label>
      <Label isDisabled>Disabled</Label>
    </div>
  );
}

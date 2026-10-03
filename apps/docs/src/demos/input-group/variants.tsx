import {InputGroup} from "@peakui/react";

export function Variants() {
  return (
    <div className="flex w-72 flex-col gap-3">
      <InputGroup fullWidth variant="primary">
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Primary" placeholder="Primary" />
      </InputGroup>
      <InputGroup fullWidth variant="secondary">
        <InputGroup.Prefix>@</InputGroup.Prefix>
        <InputGroup.Input aria-label="Secondary" placeholder="Secondary" />
      </InputGroup>
    </div>
  );
}

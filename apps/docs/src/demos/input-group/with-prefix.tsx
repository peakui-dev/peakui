import {InputGroup} from "@peakui/react";

export function WithPrefix() {
  return (
    <InputGroup className="w-72">
      <InputGroup.Prefix>@</InputGroup.Prefix>
      <InputGroup.Input aria-label="Username" placeholder="username" />
    </InputGroup>
  );
}

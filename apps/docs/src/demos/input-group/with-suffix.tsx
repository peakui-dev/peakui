import {InputGroup} from "@peakui/react";

export function WithSuffix() {
  return (
    <InputGroup className="w-72">
      <InputGroup.Input aria-label="Workspace" placeholder="workspace" />
      <InputGroup.Suffix>.example.com</InputGroup.Suffix>
    </InputGroup>
  );
}

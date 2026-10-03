import {InputGroup} from "@peakui/react";

export function WithPrefixAndSuffix() {
  return (
    <InputGroup className="w-72">
      <InputGroup.Prefix>https://</InputGroup.Prefix>
      <InputGroup.Input aria-label="Website" placeholder="website" />
      <InputGroup.Suffix>.com</InputGroup.Suffix>
    </InputGroup>
  );
}

import {Magnifier} from "@gravity-ui/icons";
import {InputGroup} from "@peakui/react";

export function Basic() {
  return (
    <InputGroup className="w-72">
      <InputGroup.Prefix>
        <Magnifier />
      </InputGroup.Prefix>
      <InputGroup.Input aria-label="Search" placeholder="Search" />
    </InputGroup>
  );
}

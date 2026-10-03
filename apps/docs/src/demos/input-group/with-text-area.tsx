import {Pencil} from "@gravity-ui/icons";
import {InputGroup} from "@peakui/react";

export function WithTextArea() {
  return (
    <InputGroup className="w-72">
      <InputGroup.Prefix>
        <Pencil />
      </InputGroup.Prefix>
      <InputGroup.TextArea aria-label="Bio" placeholder="Tell us about yourself" rows={3} />
    </InputGroup>
  );
}

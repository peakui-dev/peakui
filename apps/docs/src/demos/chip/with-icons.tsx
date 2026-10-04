import {CircleDashed} from "@gravity-ui/icons";
import {Chip} from "@peakui/react";

export function WithIcons() {
  return (
    <Chip>
      <CircleDashed />
      <Chip.Label>Label</Chip.Label>
      <CircleDashed />
    </Chip>
  );
}

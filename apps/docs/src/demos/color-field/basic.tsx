import {ColorField, ColorInputGroup, Label} from "@peakui/react";

export function Basic() {
  return (
    <ColorField defaultValue="#0485F7">
      <Label>Colour</Label>
      <ColorInputGroup>
        <ColorInputGroup.Input />
      </ColorInputGroup>
    </ColorField>
  );
}

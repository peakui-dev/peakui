import {ColorField, ColorInputGroup, ColorSwatch, Label} from "@peakui/react";

export function WithSwatch() {
  return (
    <ColorField defaultValue="#0485F7">
      <Label>Colour</Label>
      <ColorInputGroup>
        <ColorInputGroup.Prefix>
          <ColorSwatch aria-label="Current colour" size="xs" />
        </ColorInputGroup.Prefix>
        <ColorInputGroup.Input />
      </ColorInputGroup>
    </ColorField>
  );
}

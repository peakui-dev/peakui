import {ColorField, ColorInputGroup, ColorSwatch} from "@peakui/react";

export function FullWidth() {
  return (
    <ColorField fullWidth aria-label="Colour" defaultValue="#0485F7">
      <ColorInputGroup fullWidth>
        <ColorInputGroup.Prefix>
          <ColorSwatch aria-label="Current colour" size="xs" />
        </ColorInputGroup.Prefix>
        <ColorInputGroup.Input />
      </ColorInputGroup>
    </ColorField>
  );
}

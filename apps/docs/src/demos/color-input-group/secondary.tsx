import {ColorField, ColorInputGroup, ColorSwatch} from "@peakui/react";

export function Secondary() {
  return (
    <ColorField aria-label="Colour" defaultValue="#0485F7">
      <ColorInputGroup variant="secondary">
        <ColorInputGroup.Prefix>
          <ColorSwatch aria-label="Current colour" size="xs" />
        </ColorInputGroup.Prefix>
        <ColorInputGroup.Input />
      </ColorInputGroup>
    </ColorField>
  );
}

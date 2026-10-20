import {ColorField, ColorInputGroup} from "@peakui/react";

export function WithSuffix() {
  return (
    <ColorField aria-label="Colour" defaultValue="#0485F7">
      <ColorInputGroup>
        <ColorInputGroup.Input />
        <ColorInputGroup.Suffix>hex</ColorInputGroup.Suffix>
      </ColorInputGroup>
    </ColorField>
  );
}

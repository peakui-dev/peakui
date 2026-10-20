import {ColorField, ColorInputGroup, FieldError, Label} from "@peakui/react";

export function Invalid() {
  return (
    <ColorField isInvalid defaultValue="#0485F7">
      <Label>Colour</Label>
      <ColorInputGroup>
        <ColorInputGroup.Input />
      </ColorInputGroup>
      <FieldError>Pick a colour from the brand palette.</FieldError>
    </ColorField>
  );
}

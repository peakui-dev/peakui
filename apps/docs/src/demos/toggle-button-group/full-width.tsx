import {
  Bold,
  Italic,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  Underline,
} from "@gravity-ui/icons";
import {ToggleButton, ToggleButtonGroup} from "@peakui/react";

export function FullWidth() {
  return (
    <div className="mx-auto flex w-96 max-w-full flex-col gap-3">
      <ToggleButtonGroup fullWidth selectionMode="multiple">
        <ToggleButton isIconOnly aria-label="Bold" id="bold">
          <Bold />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Italic" id="italic">
          <ToggleButtonGroup.Separator />
          <Italic />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Underline" id="underline">
          <ToggleButtonGroup.Separator />
          <Underline />
        </ToggleButton>
      </ToggleButtonGroup>
      <ToggleButtonGroup fullWidth selectionMode="single">
        <ToggleButton id="left">
          <TextAlignLeft />
          Left
        </ToggleButton>
        <ToggleButton id="center">
          <ToggleButtonGroup.Separator />
          <TextAlignCenter />
          Center
        </ToggleButton>
        <ToggleButton id="right">
          <ToggleButtonGroup.Separator />
          <TextAlignRight />
          Right
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

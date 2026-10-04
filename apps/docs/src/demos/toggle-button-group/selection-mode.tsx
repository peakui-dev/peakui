import {
  Bold,
  Italic,
  Strikethrough,
  TextAlignCenter,
  TextAlignLeft,
  TextAlignRight,
  Underline,
} from "@gravity-ui/icons";
import {ToggleButton, ToggleButtonGroup} from "@peakui/react";

export function SelectionMode() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ToggleButtonGroup defaultSelectedKeys={["center"]} selectionMode="single">
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
      <ToggleButtonGroup defaultSelectedKeys={["bold", "underline"]} selectionMode="multiple">
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
        <ToggleButton isIconOnly aria-label="Strikethrough" id="strikethrough">
          <ToggleButtonGroup.Separator />
          <Strikethrough />
        </ToggleButton>
      </ToggleButtonGroup>
    </div>
  );
}

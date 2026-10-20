import {ArrowUturnCcwLeft, ArrowUturnCwRight, Bold, Italic} from "@gravity-ui/icons";
import {
  Button,
  ButtonGroup,
  Separator,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
} from "@peakui/react";

export function Vertical() {
  return (
    <Toolbar aria-label="Tools" orientation="vertical">
      <ToggleButtonGroup aria-label="Text style" selectionMode="multiple">
        <ToggleButton isIconOnly aria-label="Bold" id="bold">
          <Bold />
        </ToggleButton>
        <ToggleButton isIconOnly aria-label="Italic" id="italic">
          <ToggleButtonGroup.Separator />
          <Italic />
        </ToggleButton>
      </ToggleButtonGroup>
      <Separator />
      <ButtonGroup>
        <Button isIconOnly aria-label="Undo" variant="secondary">
          <ArrowUturnCcwLeft />
        </Button>
        <Button isIconOnly aria-label="Redo" variant="secondary">
          <ButtonGroup.Separator />
          <ArrowUturnCwRight />
        </Button>
      </ButtonGroup>
    </Toolbar>
  );
}

import {
  ArrowUturnCcwLeft,
  ArrowUturnCwRight,
  TextAlignCenter,
  TextAlignLeft,
} from "@gravity-ui/icons";
import {Button, ButtonGroup, Separator, Toolbar} from "@peakui/react";

export function WithButtonGroups() {
  return (
    <Toolbar aria-label="Editor toolbar">
      <ButtonGroup>
        <Button variant="secondary">
          <ArrowUturnCcwLeft />
          Undo
        </Button>
        <Button variant="secondary">
          <ButtonGroup.Separator />
          <ArrowUturnCwRight />
          Redo
        </Button>
      </ButtonGroup>
      <Separator />
      <ButtonGroup>
        <Button isIconOnly aria-label="Align left" variant="secondary">
          <TextAlignLeft />
        </Button>
        <Button isIconOnly aria-label="Align center" variant="secondary">
          <ButtonGroup.Separator />
          <TextAlignCenter />
        </Button>
      </ButtonGroup>
    </Toolbar>
  );
}

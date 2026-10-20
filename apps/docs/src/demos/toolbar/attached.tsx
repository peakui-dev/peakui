import {Copy, Scissors} from "@gravity-ui/icons";
import {Button, ButtonGroup, Separator, Toolbar} from "@peakui/react";

export function Attached() {
  return (
    <Toolbar isAttached aria-label="Attached toolbar">
      <Button variant="secondary">Edit</Button>
      <Separator />
      <ButtonGroup>
        <Button isIconOnly aria-label="Copy" variant="secondary">
          <Copy />
        </Button>
        <Button isIconOnly aria-label="Cut" variant="secondary">
          <ButtonGroup.Separator />
          <Scissors />
        </Button>
      </ButtonGroup>
    </Toolbar>
  );
}

import {Button, ButtonGroup} from "@peakui/react";

export function Basic() {
  return (
    <ButtonGroup>
      <Button>First</Button>
      <Button>
        <ButtonGroup.Separator />
        Second
      </Button>
      <Button>
        <ButtonGroup.Separator />
        Third
      </Button>
    </ButtonGroup>
  );
}

import {Button, ButtonGroup} from "@peakui/react";

/* Every button inherits the group's `isDisabled`; `isDisabled={false}` re-enables one button. */
export function Disabled() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup isDisabled>
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
      <ButtonGroup isDisabled>
        <Button>First</Button>
        <Button>
          <ButtonGroup.Separator />
          Second
        </Button>
        <Button isDisabled={false}>
          <ButtonGroup.Separator />
          Third (enabled)
        </Button>
      </ButtonGroup>
    </div>
  );
}

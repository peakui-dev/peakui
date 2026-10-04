import {Button, ButtonGroup} from "@peakui/react";

/*
 * `isDisabled` is set on each button: the buttons do not inherit the group's `isDisabled`.
 */
export function Disabled() {
  return (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup>
        <Button isDisabled>First</Button>
        <Button isDisabled>
          <ButtonGroup.Separator />
          Second
        </Button>
        <Button isDisabled>
          <ButtonGroup.Separator />
          Third
        </Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button isDisabled>First</Button>
        <Button isDisabled>
          <ButtonGroup.Separator />
          Second
        </Button>
        <Button>
          <ButtonGroup.Separator />
          Third (enabled)
        </Button>
      </ButtonGroup>
    </div>
  );
}

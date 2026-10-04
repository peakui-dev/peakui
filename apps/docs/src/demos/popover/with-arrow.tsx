import {Button, Popover} from "@peakui/react";

export function WithArrow() {
  return (
    <Popover>
      <Button variant="secondary">With arrow</Button>
      <Popover.Content>
        <Popover.Dialog>
          <Popover.Arrow />
          <Popover.Heading>Popover heading</Popover.Heading>
          <p>Popover with arrow indicator</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

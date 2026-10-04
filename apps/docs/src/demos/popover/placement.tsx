import {Button, Popover} from "@peakui/react";

export function Placement() {
  return (
    <div className="flex items-center gap-4">
      <Popover>
        <Button variant="tertiary">Bottom (default)</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Heading>Bottom</Popover.Heading>
            <p>placement=&quot;bottom&quot;</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <Popover>
        <Button variant="tertiary">Top</Button>
        <Popover.Content placement="top">
          <Popover.Dialog>
            <Popover.Heading>Top</Popover.Heading>
            <p>placement=&quot;top&quot;</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <Popover>
        <Button variant="tertiary">Right</Button>
        <Popover.Content offset={12} placement="right">
          <Popover.Dialog>
            <Popover.Heading>Right</Popover.Heading>
            <p>{'placement="right" offset={12}'}</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </div>
  );
}

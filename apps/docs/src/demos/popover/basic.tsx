import {CircleInfo} from "@gravity-ui/icons";
import {Button, Popover} from "@peakui/react";

export function Basic() {
  return (
    <div className="flex items-center gap-4">
      <Popover>
        <Button variant="secondary">Open popover</Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Heading>Popover heading</Popover.Heading>
            <p>This is the popover content</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>

      <Popover>
        <Button isIconOnly aria-label="More information" variant="tertiary">
          <CircleInfo />
        </Button>
        <Popover.Content>
          <Popover.Dialog>
            <Popover.Heading>Popover heading</Popover.Heading>
            <p>Any trigger element works</p>
          </Popover.Dialog>
        </Popover.Content>
      </Popover>
    </div>
  );
}

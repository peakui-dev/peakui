import {Button, Popover} from "@peakui/react";

export function CustomStyles() {
  return (
    <Popover>
      <Button variant="secondary">Share link</Button>
      <Popover.Content className="w-[240px] border border-border/80 shadow-lg">
        <Popover.Dialog className="p-3">
          <Popover.Heading className="text-xs uppercase tracking-wide">
            Share this page
          </Popover.Heading>
          <p className="mt-1 text-sm text-muted">Copy the link to send it to a teammate.</p>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

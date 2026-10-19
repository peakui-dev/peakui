import {Badge, Button} from "@peakui/react";

export function OnButton() {
  return (
    <Badge.Anchor>
      <Button aria-label="Inbox, 5 unread" variant="secondary">
        Inbox
      </Button>
      <Badge color="danger">5</Badge>
    </Badge.Anchor>
  );
}

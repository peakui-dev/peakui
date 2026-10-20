import {Button, Drawer} from "@peakui/react";

export function Basic() {
  return (
    <Drawer>
      <Button variant="secondary">Open drawer</Button>
      <Drawer.Backdrop>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Handle />
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Notifications</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <p>Slide a panel in from a screen edge without leaving the page.</p>
            </Drawer.Body>
            <Drawer.Footer>
              <Button slot="close" variant="secondary">
                Cancel
              </Button>
              <Button slot="close">Mark all read</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

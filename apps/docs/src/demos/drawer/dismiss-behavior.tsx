import {Button, Drawer} from "@peakui/react";

export function DismissBehavior() {
  return (
    <Drawer>
      <Button variant="secondary">isDismissable = false</Button>
      <Drawer.Backdrop isDismissable={false}>
        <Drawer.Content>
          <Drawer.Dialog>
            <Drawer.Header>
              <Drawer.Heading>isDismissable = false</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <p>Clicking the backdrop or dragging the panel does not close it.</p>
            </Drawer.Body>
            <Drawer.Footer>
              <Button slot="close">Close</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

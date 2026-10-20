import {Button, Drawer} from "@peakui/react";

export function CustomStyles() {
  return (
    <Drawer>
      <Button variant="secondary">Open drawer</Button>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="rounded-none [--drawer-enter-duration:400ms] sm:w-[28rem]">
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Wider and slower</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body>
              <p>Plain utilities and the drawer custom properties compose with the component.</p>
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

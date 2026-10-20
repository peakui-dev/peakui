import {Button, Drawer} from "@peakui/react";

export function ScrollingBody() {
  return (
    <Drawer>
      <Button variant="secondary">Open long drawer</Button>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Release notes</Drawer.Heading>
            </Drawer.Header>
            {/* tabIndex makes the scrollable region reachable with the keyboard. */}
            <Drawer.Body tabIndex={0}>
              {Array.from({length: 24}, (_, index) => (
                <p key={index} className="mb-3">
                  Entry {index + 1}: the body scrolls while the header and footer stay in place.
                </p>
              ))}
            </Drawer.Body>
            <Drawer.Footer>
              <Button slot="close">Done</Button>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}

import {Button, Drawer} from "@peakui/react";

const PLACEMENTS = ["bottom", "top", "left", "right"] as const;

export function Placements() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {PLACEMENTS.map((placement) => (
        <Drawer key={placement}>
          <Button variant="secondary">{placement}</Button>
          <Drawer.Backdrop>
            <Drawer.Content placement={placement}>
              <Drawer.Dialog>
                <Drawer.CloseTrigger />
                <Drawer.Header>
                  <Drawer.Heading>Placement: {placement}</Drawer.Heading>
                </Drawer.Header>
                <Drawer.Body>
                  <p>
                    The panel docks to the {placement} edge. Drag it toward that edge to dismiss.
                  </p>
                </Drawer.Body>
                <Drawer.Footer>
                  <Button slot="close">Close</Button>
                </Drawer.Footer>
              </Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
      ))}
    </div>
  );
}

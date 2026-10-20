import {ssrSmoke} from "@peakui/testing/helpers";

import {Button} from "@/components/button";
import {Drawer} from "@/components/drawer";

describe("Drawer SSR", () => {
  it("renders without a hydration mismatch while closed", async () => {
    await ssrSmoke(
      <Drawer>
        <Button>Open</Button>
        <Drawer.Backdrop>
          <Drawer.Content>
            <Drawer.Dialog>
              <Drawer.Handle />
              <Drawer.CloseTrigger />
              <Drawer.Header>
                <Drawer.Heading>Title</Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>Content</Drawer.Body>
              <Drawer.Footer>
                <Button slot="close">Continue</Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>,
    );
  });

  it("renders without a hydration mismatch with defaultOpen", async () => {
    await ssrSmoke(
      <Drawer defaultOpen>
        <Button>Open</Button>
        <Drawer.Backdrop>
          <Drawer.Content placement="right">
            <Drawer.Dialog>
              <Drawer.Heading>Title</Drawer.Heading>
              <p>Content</p>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>,
    );
  });
});

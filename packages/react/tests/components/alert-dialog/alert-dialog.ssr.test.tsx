import {ssrSmoke} from "@peakui/testing/helpers";

import {AlertDialog} from "@/components/alert-dialog";
import {Button} from "@/components/button";

describe("AlertDialog SSR", () => {
  it("renders without a hydration mismatch while closed", async () => {
    await ssrSmoke(
      <AlertDialog>
        <Button>Open</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.CloseTrigger />
              <AlertDialog.Header>
                <AlertDialog.Icon />
                <AlertDialog.Heading>Heading</AlertDialog.Heading>
              </AlertDialog.Header>
              <AlertDialog.Body>Content</AlertDialog.Body>
              <AlertDialog.Footer>
                <Button slot="close">Cancel</Button>
              </AlertDialog.Footer>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );
  });

  it("renders without a hydration mismatch with defaultOpen", async () => {
    await ssrSmoke(
      <AlertDialog defaultOpen>
        <Button>Open</Button>
        <AlertDialog.Backdrop>
          <AlertDialog.Container>
            <AlertDialog.Dialog>
              <AlertDialog.Heading>Heading</AlertDialog.Heading>
              <p>Content</p>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>,
    );
  });
});

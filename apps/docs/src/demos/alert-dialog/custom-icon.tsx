import {Rocket} from "@gravity-ui/icons";
import {AlertDialog, Button} from "@peakui/react";

export function CustomIcon() {
  return (
    <AlertDialog>
      <Button variant="secondary">Launch Project</Button>
      <AlertDialog.Backdrop>
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-[400px]">
            <AlertDialog.Header>
              <AlertDialog.Icon status="accent">
                <Rocket className="size-5" />
              </AlertDialog.Icon>
              <AlertDialog.Heading>Launch this project?</AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Not Yet
              </Button>
              <Button slot="close">Launch</Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </AlertDialog>
  );
}

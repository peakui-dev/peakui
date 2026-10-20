import {AlertDialog, Button} from "@peakui/react";

export function DismissBehavior() {
  return (
    <div className="flex flex-wrap gap-4">
      <AlertDialog>
        <Button variant="secondary">Outside click closes</Button>
        <AlertDialog.Backdrop isDismissable>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              <AlertDialog.Heading>isDismissable</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
      <AlertDialog>
        <Button variant="secondary">Escape closes</Button>
        <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
          <AlertDialog.Container>
            <AlertDialog.Dialog className="sm:max-w-[400px]">
              <AlertDialog.Heading>isKeyboardDismissDisabled = false</AlertDialog.Heading>
            </AlertDialog.Dialog>
          </AlertDialog.Container>
        </AlertDialog.Backdrop>
      </AlertDialog>
    </div>
  );
}
